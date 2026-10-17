import Link from "next/link";
import type { LeaderEntry } from "@/lib/quiz";
import { Button } from "@/components/ui/button";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toLocaleUpperCase("tr-TR");
}

export function QuizTeaser({ players, ready = true }: { players: LeaderEntry[]; ready?: boolean }) {
  return (
    <section className="overflow-hidden rounded-[2rem] bg-neutral-950 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.7)]">
      <div className="grid gap-8 p-6 sm:grid-cols-[1.1fr_0.9fr] sm:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300">Gazi Gezgin</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Ayın Gezgini Sen Ol!</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
            Tarih, mutfak, coğrafya ve plaka kodlarından on iki soru. Yanıtladığın sorular havuz tükenene kadar yeniden gelmez.
          </p>
          <Link href="/yarisma" className="mt-6 inline-block">
            <Button className="rounded-full bg-orange-500 px-6 text-white hover:bg-orange-400">Yarışmaya katıl</Button>
          </Link>
        </div>
        <ol className="space-y-2">
          {players.length === 0 ? (
            <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/70">
              {ready
                ? "Bu ayın ilk üçü henüz boş. İlk puanı sen yaz."
                : "Sıralama, yarışma tabloları kurulunca burada görünecek."}
            </li>
          ) : (
            players.map((player, index) => (
              <li key={player.userId} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                <span className="w-5 text-sm font-black text-orange-300">{index + 1}</span>
                {player.avatarUrl ? (
                  <img src={player.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
                ) : (
                  <span className="flex size-9 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-amber-300 text-[11px] font-black">
                    {initials(player.name)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{player.name}</span>
                  <span className="block text-[11px] text-white/55">{player.badge}</span>
                </span>
                <span className="text-sm font-black">{player.score}</span>
              </li>
            ))
          )}
        </ol>
      </div>
    </section>
  );
}
