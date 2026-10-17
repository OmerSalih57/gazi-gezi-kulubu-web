"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Admin Yetkisi Yardımcısı
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum açmanız gerekiyor.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Bu işlem için yetkiniz bulunmuyor.");
  }

  return { supabase, user };
}

// Başvuruyu Onayla
export async function approveRegistration(registrationId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("registrations")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", registrationId);

  if (error) {
    throw new Error("Başvuru onaylanamadı: " + error.message);
  }

  revalidatePath("/yonetim/dekontlar");
  revalidatePath("/yonetim/geziler");
  return { success: true };
}

// Başvuruyu Reddet
export async function rejectRegistration(registrationId: string, reason?: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("registrations")
    .update({
      status: "rejected",
      admin_notes: reason || "Dekont geçersiz veya ödeme doğrulanamadı.",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", registrationId);

  if (error) {
    throw new Error("Başvuru reddedilemedi: " + error.message);
  }

  revalidatePath("/yonetim/dekontlar");
  revalidatePath("/yonetim/geziler");
  return { success: true };
}