"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tripBadgeClass, type TripBadgeTone } from "@/lib/events/availability";

export type FeaturedTrip = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  priceLabel: string;
  remainingLabel: string;
  coverUrl: string | null;
  badge: string;
  tone: TripBadgeTone;
};

export function FeaturedTrips({ trips }: { trips: FeaturedTrip[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: number) => {
    const node = scroller.current;
    if (!node) return;
    node.scrollBy({ left: direction * Math.min(node.clientWidth * 0.85, 340), behavior: "smooth" });
  };

  if (trips.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Öne çıkanlar</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-zinc-50">Yaklaşan geziler</h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="size-9 rounded-full border border-neutral-200 bg-white text-sm font-bold text-neutral-700"
            aria-label="Önceki geziler"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="size-9 rounded-full border border-neutral-200 bg-white text-sm font-bold text-neutral-700"
            aria-label="Sonraki geziler"
          >
            →
          </button>
        </div>
      </div>

      <div ref={scroller} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {trips.map((trip) => (
          <article
            key={trip.id}
            className="group w-[300px] shrink-0 snap-start overflow-hidden rounded-[1.6rem] border border-white/80 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-24px_rgba(234,88,12,0.45)] dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="relative h-44 bg-neutral-100">
              {trip.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={trip.coverUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div className="h-full bg-linear-to-br from-orange-400 via-amber-500 to-sky-700" />
              )}
              <span
                className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-xs ${tripBadgeClass(trip.tone)}`}
              >
                {trip.badge}
              </span>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-[11px] font-semibold text-orange-600">{trip.startsAt}</p>
              <h3 className="line-clamp-2 text-base font-bold text-neutral-900 dark:text-zinc-50">{trip.title}</h3>
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>{trip.priceLabel}</span>
                <span>{trip.remainingLabel}</span>
              </div>
              <Link href={`/geziler/${trip.slug}`}>
                <Button className="w-full bg-orange-600 text-xs text-white hover:bg-orange-700">İncele</Button>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
