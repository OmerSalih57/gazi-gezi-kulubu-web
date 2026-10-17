import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return { user, profile: (profile as Profile | null) ?? null };
});

export async function requireUser(next = "/") {
  const me = await getCurrentProfile();
  if (!me) redirect(`/giris?next=${encodeURIComponent(next)}`);
  return me;
}

export async function requireAdmin() {
  const me = await requireUser("/yonetim");
  if (!me.profile || me.profile.role !== "admin") redirect("/");
  return { user: me.user, profile: me.profile };
}