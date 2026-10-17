export const QUESTION_SECONDS = 20;
export const QUIZ_LENGTH = 12;
export const QUIZ_TIME_LIMIT = 260;

export type QuizQuestion = {
  id: string;
  questionText: string;
  options: string[];
  category: string;
  imageUrl: string | null;
};

export type ScoreRow = {
  user_id: string;
  score: number;
  correct_count: number;
  time_taken_seconds: number;
  created_at: string;
};

export type LeaderEntry = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  score: number;
  correctCount: number;
  seconds: number;
  badge: string;
};

export function quizBadge(correctCount: number) {
  if (correctCount >= 11) return "Rota Bilgesi";
  if (correctCount >= 8) return "Pusula";
  if (correctCount >= 5) return "Gezgin Adayı";
  return "Yol Arkadaşı";
}

export function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pickQuizRound<T extends { id: string }>(pool: T[], seenIds: string[]) {
  const seen = new Set(seenIds);
  const fresh = shuffle(pool.filter((item) => !seen.has(item.id)));
  if (fresh.length >= QUIZ_LENGTH) return fresh.slice(0, QUIZ_LENGTH);
  const chosen = new Set(fresh.map((item) => item.id));
  const fill = shuffle(pool.filter((item) => !chosen.has(item.id)));
  return [...fresh, ...fill].slice(0, QUIZ_LENGTH);
}

export function bestScores(rows: ScoreRow[]) {
  const map = new Map<string, ScoreRow>();
  for (const row of rows) {
    const current = map.get(row.user_id);
    const better =
      !current ||
      row.score > current.score ||
      (row.score === current.score && row.time_taken_seconds < current.time_taken_seconds);
    if (better) map.set(row.user_id, row);
  }
  return [...map.values()].sort(
    (a, b) => b.score - a.score || a.time_taken_seconds - b.time_taken_seconds,
  );
}

export function toLeaderboard(
  rows: ScoreRow[],
  names: Map<string, { name: string; avatarUrl: string | null }>,
  limit = 10,
): LeaderEntry[] {
  return bestScores(rows)
    .slice(0, limit)
    .map((row) => {
      const person = names.get(row.user_id);
      return {
        userId: row.user_id,
        name: person?.name || "Üye",
        avatarUrl: person?.avatarUrl ?? null,
        score: row.score,
        correctCount: row.correct_count,
        seconds: row.time_taken_seconds,
        badge: quizBadge(row.correct_count),
      };
    });
}
