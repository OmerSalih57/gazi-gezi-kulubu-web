import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { ProfileSettings, type ProfileTrip } from "@/components/profile/ProfileSettings";

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export default async function ProfilePage() {
  await connection();
  const me = await requireUser("/profil");
  const supabase = await createClient();

  const [detailsResult, registrationsResult] = await Promise.all([
    supabase.from("profile_details").select("phone, tc_no, student_no").eq("user_id", me.user.id).maybeSingle(),
    supabase
      .from("registrations")
      .select("id, status, events(title, slug, starts_at)")
      .eq("user_id", me.user.id)
      .order("created_at", { ascending: false }),
  ]);

  const trips: ProfileTrip[] = ((registrationsResult.data as {
    id: string;
    status: string;
    events: { title: string; slug: string; starts_at: string } | { title: string; slug: string; starts_at: string }[] | null;
  }[] | null) ?? []).map((row) => {
    const event = Array.isArray(row.events) ? row.events[0] : row.events;
    return {
      id: row.id,
      status: row.status,
      title: event?.title || "Gezi",
      slug: event?.slug || "",
      startsAt: formatDate(event?.starts_at || null),
      ticket: row.status === "approved",
    };
  });

  return (
    <ProfileSettings
      fullName={me.profile?.full_name || ""}
      phone={detailsResult.data?.phone || ""}
      tcNo={detailsResult.data?.tc_no || ""}
      studentNo={detailsResult.data?.student_no || ""}
      avatarUrl={me.profile?.avatar_url ?? null}
      trips={trips}
      detailsReady={!detailsResult.error}
    />
  );
}
