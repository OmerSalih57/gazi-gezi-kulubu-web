"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";

const reviewSchema = z.object({
  eventId: z.string().uuid(),
  slug: z.string().min(1).max(160),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(8, "Yorum en az 8 karakter olmalıdır").max(800),
});

export async function submitReview(formData: FormData) {
  const me = await requireUser("/");
  const parsed = reviewSchema.safeParse({
    eventId: formData.get("eventId"),
    slug: formData.get("slug"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Yorum geçersiz." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("trip_reviews")
    .select("id")
    .eq("event_id", parsed.data.eventId)
    .eq("user_id", me.user.id)
    .maybeSingle();

  const payload = {
    event_id: parsed.data.eventId,
    user_id: me.user.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  };

  const { error } = existing
    ? await supabase.from("trip_reviews").update({ rating: payload.rating, comment: payload.comment }).eq("id", existing.id)
    : await supabase.from("trip_reviews").insert(payload);

  if (error) {
    const missing = /trip_reviews|schema cache/i.test(error.message);
    return {
      ok: false as const,
      error: missing
        ? "Yorum tablosu henüz yok. supabase/migrations/0006_profile_team_reviews.sql dosyasını çalıştırın."
        : "Yorum kaydedilemedi. Gezi tamamlanmış olmalı ve onaylı kaydın bulunmalı.",
    };
  }

  revalidatePath(`/geziler/${parsed.data.slug}`);
  return { ok: true as const };
}
