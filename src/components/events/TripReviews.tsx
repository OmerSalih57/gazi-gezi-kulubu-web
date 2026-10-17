"use client";

import { useState } from "react";
import Link from "next/link";
import { submitReview } from "@/actions/reviews";
import { Button } from "@/components/ui/button";

export type PublicReview = {
  id: string;
  userId: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
};

function Stars({ value, onChange }: { value: number; onChange?: (next: number) => void }) {
  return (
    <div className="flex gap-1" role={onChange ? "radiogroup" : "img"} aria-label={`${value} yıldız`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          aria-checked={onChange ? star === value : undefined}
          role={onChange ? "radio" : undefined}
          onClick={() => onChange?.(star)}
          className={`text-lg leading-none ${star <= value ? "text-orange-500" : "text-neutral-300"} ${onChange ? "hover:scale-110" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function TripReviews({
  eventId,
  slug,
  reviews,
  canReview,
  signedIn,
  completed,
  unavailable,
  viewerId,
}: {
  eventId: string;
  slug: string;
  reviews: PublicReview[];
  canReview: boolean;
  signedIn: boolean;
  completed: boolean;
  unavailable: boolean;
  viewerId: string | null;
}) {
  const own = reviews.find((review) => review.userId === viewerId);
  const [rating, setRating] = useState(own?.rating || 5);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const send = async (formData: FormData) => {
    setPending(true);
    setError(null);
    const result = await submitReview(formData);
    setPending(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <section className="space-y-4 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.4)] backdrop-blur-md sm:p-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">Katılımcı yorumları</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-950">Bu rota nasıldı?</h2>
        </div>
        <p className="text-sm font-bold text-neutral-700">
          {reviews.length === 0 ? "Henüz yıldız yok" : `${average.toFixed(1)} / 5 · ${reviews.length} yorum`}
        </p>
      </div>

      {unavailable && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Yorumlar için supabase/migrations/0006_profile_team_reviews.sql dosyasını çalıştırın.
        </p>
      )}

      {reviews.length > 0 && (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl bg-neutral-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-neutral-900">{review.name}</span>
                <Stars value={review.rating} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{review.comment}</p>
              <p className="mt-1 text-[11px] text-neutral-400">{review.createdAt}</p>
            </li>
          ))}
        </ul>
      )}

      {canReview && (
        <form action={send} className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="rating" value={rating} />
          <p className="text-sm font-semibold text-neutral-800">{own ? "Yorumunu güncelle" : "Yıldızını bırak"}</p>
          <Stars value={rating} onChange={setRating} />
          <textarea
            name="comment"
            required
            minLength={8}
            maxLength={800}
            defaultValue={own?.comment || ""}
            placeholder="Gezi, rehberlik ve program hakkında kısa bir not"
            className="min-h-24 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300"
          />
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <Button type="submit" disabled={pending} className="bg-orange-600 text-white hover:bg-orange-700">
            Yorumu kaydet
          </Button>
        </form>
      )}

      {completed && !canReview && !signedIn && (
        <Link href={`/giris?next=/geziler/${slug}`} className="text-sm font-semibold text-orange-700 hover:underline">
          Yorum yazmak için giriş yap
        </Link>
      )}
      {completed && signedIn && !canReview && (
        <p className="text-sm text-neutral-500">Yorum yazmak için bu geziye onaylı kaydın olması gerekir.</p>
      )}
      {!completed && !unavailable && (
        <p className="text-sm text-neutral-500">Yeni yorumlar gezi tamamlandıktan sonra açılır.</p>
      )}
    </section>
  );
}
