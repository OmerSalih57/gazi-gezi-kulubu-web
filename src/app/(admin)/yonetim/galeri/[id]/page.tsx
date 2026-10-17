import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { AlbumManager } from "@/components/admin/AlbumManager";
import type { Album, AlbumPhoto } from "@/types/database";

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: album, error }, { data: photos }, { data: events }] = await Promise.all([
    supabase.from("albums").select("*").eq("id", id).maybeSingle(),
    supabase.from("album_photos").select("*").eq("album_id", id).order("created_at", { ascending: true }),
    supabase.from("events").select("id, title").order("starts_at", { ascending: false }),
  ]);

  if (error || !album) notFound();
  const row = album as Album;

  return (
    <AlbumManager
      albumId={row.id}
      title={row.title}
      eventId={row.event_id}
      coverImage={row.cover_image}
      events={(events as { id: string; title: string }[] | null) ?? []}
      photos={(photos as AlbumPhoto[] | null) ?? []}
    />
  );
}
