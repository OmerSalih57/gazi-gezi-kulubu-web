"use client";

import { useState } from "react";
import type { LeaderEntry } from "@/lib/quiz";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toLocaleUpperCase("tr-TR");
}

function List({ entries }: { entries: LeaderEntry[] }) {
  if (entries.length === 0) {
    return <p className="px-2 py-6 text-sm text-neutral-500">Bu listede henüz puan yok.</p>;
  }
  return (
    <ol className="space-y-2">
      {entries.map((entry, index) => (
        <li key={entry.userId} className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-3 py-2.5 dark:bg-zinc-950/70">
          <span className="w-6 text-sm font-black text-orange-600">{index + 1}</span>
          {entry.avatarUrl ? (
            <img src={entry.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-amber-300 text-[11px] font-black text-white">
              {initials(entry.name)}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-neutral-900 dark:text-zinc-100">{entry.name}</span>
            <span className="block text-[11px] text-neutral-500">{entry.badge}</span>
          </span>
          <span className="text-sm font-black text-neutral-950">{entry.score}</span>
        </li>
      ))}
    </ol>
  );
}

export function Leaderboard({ month, allTime }: { month: LeaderEntry[]; allTime: LeaderEntry[] }) {
  const [tab, setTab] = useState<"month" | "all">("month");
  const entries = tab === "month" ? month : allTime;

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">Liderlik tablosu</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-zinc-50">En yüksek puan</h2>
        </div>
        <div className="flex rounded-full bg-neutral-100 p-1 text-xs font-semibold dark:bg-zinc-950">
          <button
            type="button"
            onClick={() => setTab("month")}
            className={`rounded-full px-3 py-1 ${tab === "month" ? "bg-neutral-950 text-white dark:bg-amber-500" : "text-neutral-600 dark:text-zinc-300"}`}
          >
            Bu ay
          </button>
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`rounded-full px-3 py-1 ${tab === "all" ? "bg-neutral-950 text-white dark:bg-amber-500" : "text-neutral-600 dark:text-zinc-300"}`}
          >
            Tüm zamanlar
          </button>
        </div>
      </div>
      <div className="mt-4">
        <List entries={entries} />
      </div>
    </section>
  );
}
