import { createClient } from "@/lib/supabase/server";
import { toLeaderboard, type LeaderEntry, type ScoreRow } from "@/lib/quiz";
import { loadPublicProfiles } from "@/lib/profiles-public";

type Client = Awaited<ReturnType<typeof createClient>>;

export async function loadQuizBoards(supabase: Client) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [monthResult, allResult] = await Promise.all([
    supabase
      .from("quiz_scores")
      .select("user_id, score, correct_count, time_taken_seconds, created_at")
      .gte("created_at", monthStart)
      .order("score", { ascending: false })
      .limit(80),
    supabase
      .from("quiz_scores")
      .select("user_id, score, correct_count, time_taken_seconds, created_at")
      .order("score", { ascending: false })
      .limit(80),
  ]);

  if (monthResult.error || allResult.error) {
    return { month: [] as LeaderEntry[], allTime: [] as LeaderEntry[], ready: false };
  }

  const monthRows = (monthResult.data ?? []) as ScoreRow[];
  const allRows = (allResult.data ?? []) as ScoreRow[];
  const ids = [...new Set([...monthRows, ...allRows].map((row) => row.user_id))];
  const profiles = await loadPublicProfiles(supabase, ids);

  const names = new Map<string, { name: string; avatarUrl: string | null }>();
  for (const profile of profiles) {
    names.set(profile.id, { name: profile.full_name || "Üye", avatarUrl: profile.avatar_url });
  }

  return {
    month: toLeaderboard(monthRows, names, 10),
    allTime: toLeaderboard(allRows, names, 10),
    ready: true,
  };
}
