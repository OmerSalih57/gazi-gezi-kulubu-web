import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export type PublicProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export async function loadPublicProfileCount(supabase: Client) {
  const view = await supabase.from("profiles_public").select("*", { count: "exact", head: true });
  if (!view.error) return view.count ?? 0;
  const legacy = await supabase.from("profiles").select("*", { count: "exact", head: true });
  return legacy.count ?? 0;
}

export async function loadPublicProfiles(supabase: Client, ids: string[]) {
  if (ids.length === 0) return [] as PublicProfile[];
  const view = await supabase.from("profiles_public").select("id, full_name, avatar_url").in("id", ids);
  if (!view.error) return (view.data ?? []) as PublicProfile[];
  const legacy = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids);
  return (legacy.data ?? []) as PublicProfile[];
}
