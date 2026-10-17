"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { registrationSchema, type RegistrationInput } from "@/lib/validations/registration";
import { enforceRateLimit } from "@/lib/security";

export async function createRegistration(input: RegistrationInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      error: "Başvuru yapabilmek için lütfen önce giriş yapınız.",
    };
  }

  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Geçersiz başvuru bilgileri.",
    };
  }

  // Aktif başvuru kontrolü
  const { data: existing } = await supabase
    .from("registrations")
    .select("id, status")
    .eq("event_id", parsed.data.eventId)
    .eq("user_id", user.id)
    .neq("status", "cancelled")
    .maybeSingle();

  if (existing) {
    return {
      ok: false as const,
      error: "Bu geziye zaten aktif bir başvurunuz bulunmaktadır.",
    };
  }

  const pace = await enforceRateLimit("trip_registration");
  if (!pace.ok) return pace;

  // Kayıt ekleme (Trigger kontenjan, deadline ve durum kontrollerini otomatik denetler)
  const { data, error } = await supabase
    .from("registrations")
    .insert({
      event_id: parsed.data.eventId,
      user_id: user.id,
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      tc_no: parsed.data.tcNo,
      student_no: parsed.data.studentNo || null,
      status: "pending_payment",
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("event_not_open")) {
      return { ok: false as const, error: "Bu gezi henüz başvuruya açık değildir." };
    }
    if (error.message.includes("registration_closed")) {
      return { ok: false as const, error: "Bu gezi için son başvuru süresi dolmuştur." };
    }
    if (error.message.includes("event_full")) {
      return { ok: false as const, error: "Üzgünüz, gezi kontenjanı dolmuştur." };
    }
    if (error.code === "23505") {
      return { ok: false as const, error: "Bu geziye zaten aktif bir başvurunuz bulunmaktadır." };
    }
    return { ok: false as const, error: `Başvuru kaydedilemedi: ${error.message}` };
  }

  revalidatePath(`/geziler/${parsed.data.eventSlug}`);
  revalidatePath("/geziler");

  return { ok: true as const, registrationId: data.id };
}

export async function uploadReceipt(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Oturum süreniz dolmuş, lütfen tekrar giriş yapınız." };
  }

  const registrationId = formData.get("registrationId") as string;
  const eventSlug = (formData.get("eventSlug") as string) || "";
  const file = formData.get("file") as File;

  if (!registrationId) {
    return { ok: false as const, error: "Geçersiz başvuru kaydı." };
  }

  if (!file || file.size === 0) {
    return { ok: false as const, error: "Lütfen bir dekont dosyası seçiniz." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { ok: false as const, error: "Dekont dosyası en fazla 5 MB olabilir." };
  }

  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return {
      ok: false as const,
      error: "Yalnızca JPG, PNG veya PDF formatında dekont yükleyebilirsiniz.",
    };
  }

  // RLS kuralına göre receipts bucket'ında dosya user_id klasöründe olmalıdır: <user_id>/<dosya>
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return { ok: false as const, error: `Dekont yüklenemedi: ${uploadError.message}` };
  }

  // attach_receipt RPC'si kaydı günceller ve durumu 'receipt_uploaded' yapar
  const { error: rpcError } = await supabase.rpc("attach_receipt", {
    p_reg: registrationId,
    p_path: filePath,
  });

  if (rpcError) {
    return { ok: false as const, error: `Dekont ilişkilendirilemedi: ${rpcError.message}` };
  }

  if (eventSlug) {
    revalidatePath(`/geziler/${eventSlug}`);
  }
  revalidatePath("/yonetim/dekontlar");

  return { ok: true as const };
}

export async function cancelMyRegistration(registrationId: string, eventSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Giriş yapmalısınız." };
  }

  const { error } = await supabase.rpc("cancel_registration", {
    p_reg: registrationId,
  });

  if (error) {
    return { ok: false as const, error: "Başvuru iptal edilemedi." };
  }

  revalidatePath(`/geziler/${eventSlug}`);
  revalidatePath("/geziler");

  return { ok: true as const };
}

export async function approveRegistration(registrationId: string) {
  const { requireAdmin } = await import("@/lib/auth/guards");
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("registrations")
    .update({ status: "approved", admin_note: null })
    .eq("id", registrationId);

  if (error) {
    return { ok: false as const, error: `Onaylama başarısız: ${error.message}` };
  }

  revalidatePath("/yonetim/dekontlar");
  revalidatePath("/yonetim/geziler");
  return { ok: true as const };
}

export async function rejectRegistration(registrationId: string, reason: string) {
  const { requireAdmin } = await import("@/lib/auth/guards");
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("registrations")
    .update({
      status: "rejected",
      admin_note: reason.trim() || "Dekont bilgileri geçersiz veya eksik.",
    })
    .eq("id", registrationId);

  if (error) {
    return { ok: false as const, error: `Reddetme işlemi başarısız: ${error.message}` };
  }

  revalidatePath("/yonetim/dekontlar");
  revalidatePath("/yonetim/geziler");
  return { ok: true as const };
}

export async function manualCheckInRegistration(registrationId: string, eventId: string) {
  const { requireAdmin } = await import("@/lib/auth/guards");
  const me = await requireAdmin();

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("registrations")
    .update({
      checked_in_at: new Date().toISOString(),
      checked_in_by: me.user.id,
    })
    .eq("id", registrationId)
    .eq("event_id", eventId)
    .is("checked_in_at", null)
    .select("id");

  if (error) {
    return { ok: false as const, error: `Yoklama kaydedilemedi: ${error.message}` };
  }

  if (!updated?.length) {
    return { ok: false as const, error: "Bu bilet bu geziye ait değil veya giriş zaten alınmış." };
  }

  revalidatePath(`/yonetim/yoklama/${eventId}`);
  return { ok: true as const };
}

