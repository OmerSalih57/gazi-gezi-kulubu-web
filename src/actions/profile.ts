"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { passwordChangeSchema, profileDetailsSchema } from "@/lib/validations/profile";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024;

function migrationHint(message: string) {
  if (/profile_details|schema cache|avatars/i.test(message)) {
    return "Profil tabloları henüz yok. supabase/migrations/0006_profile_team_reviews.sql dosyasını çalıştırın.";
  }
  return message;
}

export async function updateProfile(formData: FormData) {
  const me = await requireUser("/profil");
  const parsed = profileDetailsSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    tcNo: formData.get("tcNo"),
    studentNo: String(formData.get("studentNo") || ""),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Bilgiler geçersiz." };
  }

  const supabase = await createClient();
  const { error: nameError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", me.user.id);
  if (nameError) return { ok: false as const, error: nameError.message };

  const { error: detailError } = await supabase.from("profile_details").upsert({
    user_id: me.user.id,
    phone: parsed.data.phone,
    tc_no: parsed.data.tcNo,
    student_no: parsed.data.studentNo || null,
    updated_at: new Date().toISOString(),
  });
  if (detailError) return { ok: false as const, error: migrationHint(detailError.message) };

  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    if (!IMAGE_TYPES.includes(avatar.type)) {
      return { ok: false as const, error: "Yalnızca JPG, PNG veya WEBP yükleyebilirsiniz." };
    }
    if (avatar.size > MAX_BYTES) {
      return { ok: false as const, error: "Profil fotoğrafı en fazla 4 MB olabilir." };
    }
    const ext = avatar.type === "image/png" ? "png" : avatar.type === "image/webp" ? "webp" : "jpg";
    const path = `${me.user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatar, {
      contentType: avatar.type,
      upsert: false,
    });
    if (uploadError) return { ok: false as const, error: migrationHint(uploadError.message) };
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: avatarError } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", me.user.id);
    if (avatarError) return { ok: false as const, error: avatarError.message };
  }

  revalidatePath("/profil");
  revalidatePath("/");
  return { ok: true as const };
}

export async function changePassword(formData: FormData) {
  await requireUser("/profil");
  const parsed = passwordChangeSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Şifre geçersiz." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
