"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/guards";
import { pickQuizRound, QUIZ_LENGTH, QUIZ_TIME_LIMIT, type QuizQuestion } from "@/lib/quiz";
import { signQuizSession, verifyQuizSession } from "@/lib/quiz-session";
import { clientIp } from "@/lib/security";

const genericError = "Sistemsel bir hata oluştu, lütfen tekrar deneyin.";

export type QuizAnswer = {
  questionId: string;
  choice: number;
  elapsedSeconds: number;
};

export async function startQuizRound() {
  const me = await getCurrentProfile();
  if (!me) return { ok: false as const, error: "Yarışmak için giriş yapmalısınız." };

  const supabase = await createClient();
  const [{ data, error }, progress] = await Promise.all([
    supabase.from("quiz_questions_public").select("id, question_text, options, category, image_url"),
    supabase.from("quiz_progress").select("seen_question_ids").eq("user_id", me.user.id).maybeSingle(),
  ]);
  if (error) {
    console.error("startQuizRound", error.message);
    return { ok: false as const, error: genericError };
  }

  const pool: QuizQuestion[] = ((data as { id: string; question_text: string; options: unknown; category: string; image_url: string | null }[] | null) ?? [])
    .map((row) => ({
      id: row.id,
      questionText: row.question_text,
      options: Array.isArray(row.options) ? row.options.filter((item): item is string => typeof item === "string") : [],
      category: row.category,
      imageUrl: row.image_url,
    }))
    .filter((row) => row.options.length === 4);

  const seen = Array.isArray(progress.data?.seen_question_ids)
    ? progress.data.seen_question_ids.filter((id: unknown): id is string => typeof id === "string")
    : [];
  const questions = pickQuizRound(pool, seen);
  if (questions.length < QUIZ_LENGTH) {
    return { ok: false as const, error: "Yarışma için yeterli soru yok." };
  }

  const ids = questions.map((question) => question.id);
  const issued = await supabase.rpc("issue_quiz_round", { p_ids: ids });
  if (issued.error && !/issue_quiz_round|schema cache|does not exist|could not find/i.test(issued.error.message)) {
    console.error("issue_quiz_round", issued.error.message);
    return { ok: false as const, error: genericError };
  }

  try {
    const token = await signQuizSession(me.user.id, ids);
    return { ok: true as const, questions, token };
  } catch (error) {
    console.error("signQuizSession", error);
    return { ok: false as const, error: genericError };
  }
}

export async function submitQuiz(answers: QuizAnswer[], token: string) {
  const me = await getCurrentProfile();
  if (!me) return { ok: false as const, error: "Yarışmak için giriş yapmalısınız." };
  if (answers.length !== QUIZ_LENGTH) return { ok: false as const, error: "On iki yanıt gerekli." };

  let session: Awaited<ReturnType<typeof verifyQuizSession>>;
  try {
    session = await verifyQuizSession(token);
  } catch (error) {
    console.error("verifyQuizSession", error);
    return { ok: false as const, error: genericError };
  }
  if (!session || session.userId !== me.user.id) {
    return { ok: false as const, error: "Tur doğrulanamadı. Yarışmayı yeniden başlatın." };
  }

  const expected = new Set(session.questionIds);
  const received = answers.map((answer) => answer.questionId);
  if (received.length !== expected.size || received.some((id) => !expected.has(id))) {
    return { ok: false as const, error: "Tur doğrulanamadı. Yarışmayı yeniden başlatın." };
  }

  const seconds = Math.min(QUIZ_TIME_LIMIT, Math.max(1, Math.round(Date.now() / 1000 - session.issuedAt)));

  const supabase = await createClient();
  const ip = await clientIp();
  const { data, error } = await supabase.rpc("submit_quiz", {
    p_answers: answers.map((answer) => ({
      question_id: answer.questionId,
      choice: answer.choice,
    })),
    p_time_taken_seconds: seconds,
    p_ip: ip || null,
  });

  if (error) {
    if (/çok sık|çok fazla/i.test(error.message)) {
      return { ok: false as const, error: "Çok sık deneme. Yeni bir tur için üç dakika bekleyin." };
    }
    console.error("submit_quiz", error.message);
    return { ok: false as const, error: genericError };
  }

  revalidatePath("/yarisma");
  revalidatePath("/");

  const result = data as {
    score: number;
    correct_count: number;
    time_taken_seconds: number;
    results: { question_id: string; correct: boolean }[];
  };

  return { ok: true as const, result };
}
