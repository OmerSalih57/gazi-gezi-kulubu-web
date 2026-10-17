import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GalleryGrid, type GalleryAlbum } from "@/components/gallery/GalleryGrid";

type PhotoRow = { id: string; image_url: string; caption: string | null; created_at?: string };
type AlbumRow = {
  id: string;
  title: string;
  cover_image: string | null;
  created_at: string;
  album_photos: PhotoRow[] | null;
  events: { title: string } | { title: string }[] | null;
};

function eventTitle(events: AlbumRow["events"]) {
  if (!events) return null;
  if (Array.isArray(events)) return events[0]?.title ?? null;
  return events.title;
}

export default async function GalleryPage() {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("albums")
    .select("id, title, cover_image, created_at, album_photos(id, image_url, caption, created_at), events(title)")
    .order("created_at", { ascending: false });

  const albums: GalleryAlbum[] = ((data as AlbumRow[] | null) ?? []).map((album) => ({
    id: album.id,
    title: album.title,
    coverImage: album.cover_image,
    eventTitle: eventTitle(album.events),
    photos: (album.album_photos ?? [])
      .slice()
      .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""))
      .map((photo) => ({ id: photo.id, imageUrl: photo.image_url, caption: photo.caption })),
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-2 border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Kulüp arşivi</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl dark:text-zinc-50">Gezi galerisi</h1>
        <p className="max-w-2xl text-neutral-500">
          Tamamlanan gezilerin fotoğrafları albüm albüm durur. Bir kapağa tıklayınca kareler büyük ekranda açılır.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          Galeri şu anda yüklenemiyor. Kısa süre sonra yeniden deneyin.
        </div>
      ) : albums.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <h2 className="text-lg font-bold text-neutral-900">Henüz albüm yok</h2>
          <p className="mt-2 text-sm text-neutral-500">İlk gezi fotoğrafları yayınlandığında burada görünecek.</p>
        </div>
      ) : (
        <GalleryGrid albums={albums} />
      )}
    </div>
  );
}
