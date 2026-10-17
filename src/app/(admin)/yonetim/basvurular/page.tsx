import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApplicationManager, type StoredApplication } from "@/components/admin/ApplicationManager";

function asStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asAnswers(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { prompt?: unknown; answer?: unknown };
    return [{ prompt: typeof row.prompt === "string" ? row.prompt : "Soru", answer: typeof row.answer === "string" ? row.answer : "" }];
  });
}

export default async function ApplicationsAdminPage() {
  await connection();
  const supabase = await createClient();
  const [{ data: settings, error: settingsError }, { data: questions }, { data: applications }] = await Promise.all([
    supabase.from("application_settings").select("is_accepting, closing_message, title, description, departments").eq("id", 1).maybeSingle(),
    supabase.from("application_questions").select("prompt, required, sort_order").order("sort_order", { ascending: true }),
    supabase
      .from("team_applications")
      .select("id, full_name, department_class, student_no, phone, selected_departments, answers, status, created_at")
      .order("created_at", { ascending: false })
      .limit(300),
  ]);

  const rows: StoredApplication[] = ((applications as {
    id: string;
    full_name: string;
    department_class: string;
    student_no: string;
    phone: string;
    selected_departments: unknown;
    answers: unknown;
    status: "pending" | "approved" | "rejected";
    created_at: string;
  }[] | null) ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    departmentClass: row.department_class,
    studentNo: row.student_no,
    phone: row.phone,
    departments: asStrings(row.selected_departments),
    answers: asAnswers(row.answers),
    status: row.status,
    createdAt: new Date(row.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }),
  }));

  return (
    <ApplicationManager
      ready={!settingsError && !!settings}
      initial={{
        isAccepting: settings?.is_accepting ?? false,
        closingMessage: settings?.closing_message || "",
        title: settings?.title || "",
        description: settings?.description || "",
        departments: asStrings(settings?.departments),
        questions: ((questions as { prompt: string; required: boolean }[] | null) ?? []).map((question) => ({
          prompt: question.prompt,
          required: question.required,
        })),
      }}
      applications={rows}
    />
  );
}
