import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/guards";
import { QuizLobby } from "@/components/quiz/QuizLobby";
import { Leaderboard } from "@/components/quiz/Leaderboard";
import { loadQuizBoards } from "@/lib/quiz-board";

export default async function QuizPage() {
  await connection();
  const supabase = await createClient();
  const me = await getCurrentProfile();
  const [questionsResult, boards] = await Promise.all([
    supabase.from("quiz_questions_public").select("id, question_text, options, category, image_url"),
    loadQuizBoards(supabase),
  ]);

  const ready = !questionsResult.error && boards.ready;
  const mine = me ? boards.allTime.find((entry) => entry.userId === me.user.id) : undefined;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] bg-neutral-950 px-6 py-10 text-white sm:px-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-300">Gazi Gezgin</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">Bilgi yarışması</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">
          Süre, Yarışmaya Başla düğmesine basınca işler. Sorular o anda seçilir.
        </p>
        {mine && (
          <p className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
            Rozetin: {mine.badge} · {mine.score} puan
          </p>
        )}
      </section>

      {!ready && (
        <p className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Yarışma henüz hazır değil. Supabase SQL Editor’da <span className="font-semibold">supabase/migrations/0005_quiz_gamification.sql</span> dosyasını çalıştırın.
        </p>
      )}

      {ready && <QuizLobby signedIn={Boolean(me)} />}

      <Leaderboard month={boards.month} allTime={boards.allTime} />
    </div>
  );
}
