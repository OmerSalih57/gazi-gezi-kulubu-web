"use client";

import { useState } from "react";
import type { ItineraryStop, RouteHighlight } from "@/lib/events/story";

const washes = [
  "from-orange-500 via-amber-400 to-rose-500",
  "from-sky-600 via-cyan-500 to-teal-400",
  "from-violet-600 via-fuchsia-500 to-orange-400",
  "from-emerald-600 via-lime-500 to-amber-300",
];

export function TripStory({
  stops,
  highlights,
  usingSchedule,
}: {
  stops: ItineraryStop[];
  highlights: RouteHighlight[];
  usingSchedule: boolean;
}) {
  const [active, setActive] = useState(0);
  const stop = stops[active];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] backdrop-blur-md sm:p-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">Program</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-neutral-950">Günün akışı</h2>
          </div>
          {usingSchedule && (
            <p className="max-w-48 text-right text-[11px] text-neutral-400">Saatler gezinin kayıtlı başlangıç ve bitişinden üretildi.</p>
          )}
        </div>
        <ol className="mt-6 space-y-2">
          {stops.map((item, index) => {
            const selected = index === active;
            return (
              <li key={`${item.time}-${item.title}`}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActive(index)}
                  className={`flex w-full items-start gap-4 rounded-2xl px-3 py-3 text-left transition ${
                    selected ? "bg-neutral-950 text-white shadow-lg" : "hover:bg-orange-50"
                  }`}
                >
                  <span className={`mt-1 size-3 shrink-0 rounded-full ${selected ? "bg-orange-400" : "bg-orange-500"}`} />
                  <span>
                    <span className={`block text-[11px] font-semibold ${selected ? "text-orange-200" : "text-orange-600"}`}>
                      {item.time || "Saat yok"}
                    </span>
                    <span className="block text-sm font-bold">{item.title}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {stop && <p className="mt-4 text-sm leading-relaxed text-neutral-600">{stop.description}</p>}
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">Rota</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-neutral-950">Duraklar</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {highlights.map((item, index) => (
            <article
              key={item.title}
              className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${washes[index % washes.length]} p-5 text-white shadow-[0_18px_40px_-24px_rgba(234,88,12,0.8)]`}
            >
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">0{index + 1}</p>
                <h3 className="mt-2 text-lg font-black tracking-tight">{item.title}</h3>
                {item.description && <p className="mt-2 text-sm text-white/85">{item.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
