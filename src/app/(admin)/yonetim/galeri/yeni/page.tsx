import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { NewAlbumForm } from "@/components/admin/NewAlbumForm";

export default async function NewAlbumPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("id, title").order("starts_at", { ascending: false });
  const events = (data as { id: string; title: string }[] | null) ?? [];
  return <NewAlbumForm events={events} />;
}
