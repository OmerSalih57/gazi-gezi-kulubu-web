"use client";

import { useState } from "react";
import Link from "next/link";
import { startQuizRound } from "@/actions/quiz";
import { QuizArena } from "@/components/quiz/QuizArena";
import { QUESTION_SECONDS, QUIZ_LENGTH, type QuizQuestion } from "@/lib/quiz";
import { Button } from "@/components/ui/button";

const RULES = [
  `${QUIZ_LENGTH} soru, her biri ${QUESTION_SECONDS} saniye.`,
  "Süre dolunca soru boş sayılır ve puan yazılmaz.",
  "Puan, doğru sayısı ve toplam süreyle sunucuda hesaplanır.",
  "Aynı hesap üç dakikada bir tur gönderebilir.",
  "Çözdüğün sorular havuz tükenene kadar yeniden gelmez.",
];

const BADGES = [
  ["Rota Bilgesi", "11–12 doğru"],
  ["Pusula", "8–10 doğru"],
  ["Gezgin Adayı", "5–7 doğru"],
  ["Yol Arkadaşı", "4 ve altı"],
];

export function QuizLobby({ signedIn }: { signedIn: boolean }) {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const begin = async () => {
    setPending(true);
    setError(null);
    const result = await startQuizRound();
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setToken(result.token);
    setQuestions(result.questions);
  };

  if (questions && token) {
    return <QuizArena questions={questions} token={token} />;
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.7)] dark:border-zinc-800 dark:bg-zinc-900/80 dark:shadow-[0_0_80px_-36px_rgba(245,158,11,0.45)]">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300">Tur kuralları</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Hazırsan süre başlar</h2>
          <ul className="mt-5 space-y-2 text-sm leading-relaxed text-white/75">
            {RULES.map((rule) => (
              <li key={rule} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
          <div className="mt-6">
            {signedIn ? (
              <Button
                type="button"
                onClick={() => void begin()}
                disabled={pending}
                className="rounded-full bg-orange-500 px-6 text-white hover:bg-orange-400"
              >
                {pending ? "Sorular hazırlanıyor..." : "Yarışmaya Başla"}
              </Button>
            ) : (
              <Link href="/giris?next=/yarisma">
                <Button className="rounded-full bg-orange-500 px-6 text-white hover:bg-orange-400">
                  Yarışmaya Başla
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300">Rozetler</p>
          <ul className="mt-4 space-y-2">
            {BADGES.map(([name, detail]) => (
              <li key={name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm font-bold">{name}</span>
                <span className="text-xs text-white/55">{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
