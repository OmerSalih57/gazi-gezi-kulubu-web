"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { parseHighlights, parseItinerary } from "@/lib/events/story";
import { eventDateError, eventSchema, slugify, type EventInput } from "@/lib/validations/event";
import type { EventStatus } from "@/types/database";

const EVENT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SLUG_TAKEN =
  "Bu slug (URL adresi) zaten başka bir gezi tarafından kullanılıyor. Lütfen farklı bir slug belirleyin.";

export async function createEvent(input: EventInput) {
  // 1. Yönetici yetki kontrolü
  const me = await requireAdmin();

  // 2. Form verilerini doğrula
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Geçersiz form verisi" };
  }

  const {
    title,
    slug,
    description,
    cover_url,
    starts_at,
    ends_at,
    registration_deadline,
    price_try,
    capacity,
    payment_info,
    status,
  } = parsed.data;

  const finalSlug = slug ? slugify(slug) : slugify(title);

  const supabase = await createClient();

  // 3. Slug benzersizlik kontrolü
  const { data: existingSlug } = await supabase
    .from("events")
    .select("id")
    .eq("slug", finalSlug)
    .maybeSingle();

  if (existingSlug) {
    return { ok: false as const, error: SLUG_TAKEN };
  }

  // 4. Veritabanına kaydet
  const { data, error } = await supabase
    .from("events")
    .insert({
      title,
      slug: finalSlug,
      description: description || null,
      cover_url: cover_url || null,
      starts_at: new Date(starts_at).toISOString(),
      ends_at: ends_at ? new Date(ends_at).toISOString() : null,
      registration_deadline: registration_deadline
        ? new Date(registration_deadline).toISOString()
        : null,
      price_try,
      capacity,
      payment_info: payment_info || null,
      status: status || "draft",
      created_by: me.user.id,
    })
    .select("id, slug, title")
    .single();

  if (error) {
    console.error("Gezi oluşturma hatası:", error);
    return { ok: false as const, error: `Gezi kaydedilemedi: ${error.message}` };
  }

  revalidatePath("/yonetim/geziler");
  revalidatePath("/geziler");

  return { ok: true as const, data };
}

export async function updateEvent(id: string, input: EventInput) {
  await requireAdmin();

  if (!EVENT_ID.test(id)) {
    return { ok: false as const, error: "Geçersiz gezi kaydı." };
  }

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Geçersiz form verisi" };
  }

  const dateError = eventDateError(parsed.data);
  if (dateError) return { ok: false as const, error: dateError };

  const {
    title,
    slug,
    description,
    cover_url,
    starts_at,
    ends_at,
    registration_deadline,
    price_try,
    capacity,
    payment_info,
    status,
  } = parsed.data;

  const finalSlug = slug ? slugify(slug) : slugify(title);
  if (!/^[a-z0-9-]{3,150}$/.test(finalSlug)) {
    return { ok: false as const, error: "Slug yalnızca küçük harf, rakam ve tire (-) içerebilir." };
  }

  const supabase = await createClient();

  const { data: current, error: currentError } = await supabase
    .from("events")
    .select("id, slug")
    .eq("id", id)
    .maybeSingle();

  if (currentError || !current) {
    return { ok: false as const, error: "Düzenlenecek gezi bulunamadı." };
  }

  const { data: existingSlug } = await supabase
    .from("events")
    .select("id")
    .eq("slug", finalSlug)
    .neq("id", id)
    .maybeSingle();

  if (existingSlug) {
    return { ok: false as const, error: SLUG_TAKEN };
  }

  const { data, error } = await supabase
    .from("events")
    .update({
      title,
      slug: finalSlug,
      description: description || null,
      cover_url: cover_url || null,
      starts_at: new Date(starts_at).toISOString(),
      ends_at: ends_at ? new Date(ends_at).toISOString() : null,
      registration_deadline: registration_deadline
        ? new Date(registration_deadline).toISOString()
        : null,
      price_try,
      capacity,
      payment_info: payment_info || null,
      status: status || "draft",
    })
    .eq("id", id)
    .select("id, slug, title")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, error: SLUG_TAKEN };
    }
    console.error("Gezi güncelleme hatası:", error);
    return { ok: false as const, error: `Gezi güncellenemedi: ${error.message}` };
  }

  revalidatePath("/yonetim/geziler");
  revalidatePath(`/yonetim/geziler/${id}`);
  revalidatePath("/geziler");
  revalidatePath(`/geziler/${finalSlug}`);
  if (current.slug && current.slug !== finalSlug) {
    revalidatePath(`/geziler/${current.slug}`);
  }

  const storyText = `${parsed.data.itinerary_text || ""}${parsed.data.highlights_text || ""}`.trim();
  if (storyText) {
    const story = await supabase
      .from("events")
      .update({
        itinerary: parseItinerary(parsed.data.itinerary_text || ""),
        highlights: parseHighlights(parsed.data.highlights_text || ""),
      })
      .eq("id", id);
    if (story.error && /itinerary|highlights|column|schema cache/i.test(story.error.message)) {
      return {
        ok: false as const,
        error: "Gezi kaydedildi. Program ve rota için supabase/migrations/0004_event_story.sql dosyasını çalıştırın.",
      };
    }
    if (story.error) {
      return { ok: false as const, error: `Program kaydedilemedi: ${story.error.message}` };
    }
  }

  return { ok: true as const, data };
}

export async function updateEventStatus(id: string, status: EventStatus) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { ok: false as const, error: `Gezi durumu güncellenemedi: ${error.message}` };
  }

  revalidatePath("/yonetim/geziler");
  revalidatePath("/geziler");
  return { ok: true as const };
}

export async function deleteEvent(id: string) {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    return { ok: false as const, error: `Gezi silinemedi: ${error.message}` };
  }

  revalidatePath("/yonetim/geziler");
  revalidatePath("/geziler");
  return { ok: true as const };
}
