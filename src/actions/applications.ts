"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireAdmin } from "@/lib/auth/guards";
import { applicationSettingsSchema, applicationStatusSchema } from "@/lib/validations/application";
import { enforceRateLimit } from "@/lib/security";

const phonePattern = /^[0-9+ ()-]{10,20}$/;

function migrationHint(message: string) {
  if (/application_settings|application_questions|team_applications|schema cache/i.test(message)) {
    return "Başvuru tabloları henüz yok. supabase/migrations/0006_profile_team_reviews.sql dosyasını çalıştırın.";
  }
  return message;
}

function refresh() {
  revalidatePath("/basvuru");
  revalidatePath("/yonetim/basvurular");
}

export async function saveApplicationForm(input: unknown) {
  await requireAdmin();
  const parsed = applicationSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Form ayarları geçersiz." };
  }

  const departments = [...new Set(parsed.data.departments.map((item) => item.trim()).filter(Boolean))];
  const supabase = await createClient();
  const { error: settingsError } = await supabase.from("application_settings").upsert({
    id: 1,
    is_accepting: parsed.data.isAccepting,
    closing_message: parsed.data.closingMessage,
    title: parsed.data.title,
    description: parsed.data.description,
    departments,
    updated_at: new Date().toISOString(),
  });
  if (settingsError) return { ok: false as const, error: migrationHint(settingsError.message) };

  const { error: deleteError } = await supabase.from("application_questions").delete().not("id", "is", null);
  if (deleteError) return { ok: false as const, error: migrationHint(deleteError.message) };

  if (parsed.data.questions.length > 0) {
    const { error: insertError } = await supabase.from("application_questions").insert(
      parsed.data.questions.map((question, index) => ({
        prompt: question.prompt,
        required: question.required,
        sort_order: index,
      })),
    );
    if (insertError) return { ok: false as const, error: migrationHint(insertError.message) };
  }

  refresh();
  return { ok: true as const };
}

export async function submitTeamApplication(input: unknown) {
  const me = await getCurrentProfile();
  if (!me) return { ok: false as const, error: "Başvuru için giriş yapmalısınız." };
  const shape = z.object({
    fullName: z.string().trim().min(3).max(100),
    departmentClass: z.string().trim().min(2).max(80),
    studentNo: z.string().trim().min(4).max(20),
    phone: z.string().trim().regex(phonePattern, "Geçerli bir telefon numarası giriniz"),
    departments: z.array(z.string().trim().min(2).max(40)).min(1, "En az bir ekip seçin"),
    weeklyDays: z.number().int().min(1).max(7),
    answers: z.array(z.object({ questionId: z.string().uuid(), answer: z.string().trim().max(2000) })),
    kvkkConsent: z.literal(true, { error: "KVKK onayını vermelisiniz" }),
  });
  const parsed = shape.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Başvuru geçersiz." };
  }

  const supabase = await createClient();
  const [{ data: settings, error: settingsError }, { data: questions, error: questionsError }] = await Promise.all([
    supabase.from("application_settings").select("is_accepting, departments").eq("id", 1).maybeSingle(),
    supabase.from("application_questions").select("id, prompt, required").order("sort_order", { ascending: true }),
  ]);
  if (settingsError || questionsError) {
    return { ok: false as const, error: migrationHint(settingsError?.message || questionsError?.message || "") };
  }
  if (!settings?.is_accepting) return { ok: false as const, error: "Başvurular şu anda kapalı." };

  const allowed = new Set(Array.isArray(settings.departments) ? settings.departments.filter((item: unknown): item is string => typeof item === "string") : []);
  if (parsed.data.departments.some((item) => !allowed.has(item))) {
    return { ok: false as const, error: "Seçilen ekiplerden biri artık açık değil." };
  }

  const answerMap = new Map(parsed.data.answers.map((item) => [item.questionId, item.answer]));
  const storedAnswers = [];
  let sawAvailability = false;
  for (const question of questions ?? []) {
    const isAvailability = /haftada/i.test(question.prompt) && /(zaman|gün)/i.test(question.prompt);
    const answer = isAvailability ? `${parsed.data.weeklyDays} gün` : answerMap.get(question.id) || "";
    if (isAvailability) sawAvailability = true;
    else if (question.required && answer.length < 8) {
      return { ok: false as const, error: `“${question.prompt}” yanıtı en az 8 karakter olmalıdır.` };
    }
    storedAnswers.push({ question_id: question.id, prompt: question.prompt, answer });
  }
  if (!sawAvailability) {
    storedAnswers.push({
      question_id: "availability",
      prompt: "Haftada bu işe ne kadar zaman ayırabilirsin?",
      answer: `${parsed.data.weeklyDays} gün`,
    });
  }

  const { data: pending } = await supabase
    .from("team_applications")
    .select("id")
    .eq("user_id", me.user.id)
    .eq("status", "pending")
    .maybeSingle();
  if (pending) return { ok: false as const, error: "İncelenmekte olan bir başvurun var." };

  const pace = await enforceRateLimit("team_application");
  if (!pace.ok) return pace;

  const { error } = await supabase.from("team_applications").insert({
    user_id: me.user.id,
    full_name: parsed.data.fullName,
    department_class: parsed.data.departmentClass,
    student_no: parsed.data.studentNo,
    phone: parsed.data.phone,
    selected_departments: parsed.data.departments,
    answers: storedAnswers,
    status: "pending",
  });
  if (error) return { ok: false as const, error: migrationHint(error.message) };

  refresh();
  return { ok: true as const };
}

export async function updateApplicationStatus(id: string, status: string) {
  await requireAdmin();
  const parsedStatus = applicationStatusSchema.safeParse(status);
  if (!z.string().uuid().safeParse(id).success || !parsedStatus.success) {
    return { ok: false as const, error: "Başvuru durumu geçersiz." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("team_applications").update({ status: parsedStatus.data }).eq("id", id);
  if (error) return { ok: false as const, error: migrationHint(error.message) };
  refresh();
  return { ok: true as const };
}
