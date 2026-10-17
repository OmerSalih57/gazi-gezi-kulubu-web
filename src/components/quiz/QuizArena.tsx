"use client";

import { useEffect, useRef, useState } from "react";
import { submitQuiz } from "@/actions/quiz";
import { QUESTION_SECONDS, QUIZ_LENGTH, quizBadge, type QuizQuestion } from "@/lib/quiz";
import { Button } from "@/components/ui/button";

type Outcome = {
  score: number;
  correctCount: number;
  seconds: number;
  badge: string;
  flags: boolean[];
};

type StoredAnswer = { questionId: string; choice: number; elapsedSeconds: number };

export function QuizArena({ questions, token }: { questions: QuizQuestion[]; token: string }) {
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(QUESTION_SECONDS);
  const [picked, setPicked] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const answers = useRef<StoredAnswer[]>([]);
  const questionStarted = useRef(Date.now());
  const answering = useRef(false);
  const finished = useRef(false);

  const finish = async (finalAnswers: StoredAnswer[]) => {
    if (finished.current) return;
    finished.current = true;
    setPending(true);
    const response = await submitQuiz(finalAnswers, token);
    setPending(false);
    if (!response.ok) {
      finished.current = false;
      setError(response.error);
      return;
    }
    const flags = questions.map(
      (question) => response.result.results.find((item) => item.question_id === question.id)?.correct ?? false,
    );
    setOutcome({
      score: response.result.score,
      correctCount: response.result.correct_count,
      seconds: response.result.time_taken_seconds,
      badge: quizBadge(response.result.correct_count),
      flags,
    });
  };

  const commit = (choice: number) => {
    if (answering.current || finished.current || outcome) return;
    answering.current = true;
    const elapsed = Math.min(
      QUESTION_SECONDS,
      Math.max(0, Math.round((Date.now() - questionStarted.current) / 1000)),
    );
    const next = [...answers.current, { questionId: questions[index].id, choice, elapsedSeconds: elapsed }];
    answers.current = next;
    setPicked(choice);
    window.setTimeout(() => {
      if (next.length >= questions.length) {
        void finish(next);
        return;
      }
      setIndex((current) => current + 1);
      setPicked(null);
      setLeft(QUESTION_SECONDS);
      questionStarted.current = Date.now();
      answering.current = false;
    }, 280);
  };

  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    if (outcome) return;
    const startedAt = Date.now();
    questionStarted.current = startedAt;
    const timer = window.setInterval(() => {
      if (answering.current) return;
      const remain = QUESTION_SECONDS - Math.floor((Date.now() - startedAt) / 1000);
      if (remain <= 0) {
        window.clearInterval(timer);
        commitRef.current(-1);
        return;
      }
      setLeft(remain);
    }, 200);
    return () => window.clearInterval(timer);
  }, [index, outcome]);

  if (questions.length < QUIZ_LENGTH) {
    return (
      <p className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        Yarışma için yeterli soru yok. SQL betiği çalıştıktan sonra sayfayı yenileyin.
      </p>
    );
  }

  if (outcome) {
    return (
      <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/80">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">Sonuç</p>
        <h2 className="mt-2 text-4xl font-black tracking-tight text-neutral-950 dark:text-zinc-50">{outcome.score} puan</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-zinc-300">
          {outcome.correctCount} / {QUIZ_LENGTH} doğru · {outcome.seconds} sn
        </p>
        <p className="mt-4 inline-flex rounded-full bg-neutral-950 px-3 py-1 text-xs font-bold text-white">
          Rozet: {outcome.badge}
        </p>
        <ul className="mt-6 space-y-2">
          {questions.map((question, itemIndex) => (
            <li key={question.id} className="rounded-2xl bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:bg-zinc-950/70 dark:text-zinc-200">
              <span className={outcome.flags[itemIndex] ? "text-emerald-700" : "text-rose-700"}>
                {outcome.flags[itemIndex] ? "Doğru" : "Yanlış"}
              </span>
              {" · "}
              {question.questionText}
            </li>
          ))}
        </ul>
        <Button type="button" className="mt-6 bg-orange-600 text-white hover:bg-orange-700" onClick={() => window.location.reload()}>
          Yeni tur
        </Button>
      </div>
    );
  }

  const question = questions[index];

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">
          {question.category} · {index + 1} / {questions.length}
        </p>
        <p className="rounded-full bg-neutral-950 px-3 py-1 text-sm font-black text-white">{left} sn</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-zinc-800">
        <div className="h-full bg-orange-500 transition-all" style={{ width: `${(left / QUESTION_SECONDS) * 100}%` }} />
      </div>
      <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-zinc-50">{question.questionText}</h2>
      {error && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-rose-700">{error}</p>
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Tekrar dene
          </Button>
        </div>
      )}
      <div className="mt-5 grid gap-2">
        {question.options.map((option, optionIndex) => (
          <button
            key={option}
            type="button"
            disabled={picked !== null || pending}
            onClick={() => commit(optionIndex)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition hover:-translate-y-0.5 ${
              picked === optionIndex
                ? "border-neutral-950 bg-neutral-950 text-white dark:border-amber-500 dark:bg-amber-500 dark:text-white"
                : "border-neutral-200 bg-white text-neutral-800 hover:border-orange-300 hover:bg-orange-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-amber-500 dark:hover:bg-zinc-800 dark:hover:text-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {pending && <p className="mt-4 text-sm text-neutral-500">Puan hesaplanıyor...</p>}
    </div>
  );
}
