import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  title: string;
  cover_image: string | null;
  created_at: string;
  events: { title: string } | { title: string }[] | null;
  album_photos: { id: string }[] | null;
};

function relatedTitle(events: Row["events"]) {
  if (!events) return "Geziye bağlı değil";
  if (Array.isArray(events)) return events[0]?.title ?? "Geziye bağlı değil";
  return events.title;
}

export default async function AdminGalleryPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("albums")
    .select("id, title, cover_image, created_at, events(title), album_photos(id)")
    .order("created_at", { ascending: false });

  const albums = (data as Row[] | null) ?? [];
  const missing = Boolean(error && /albums|album_photos|schema cache/i.test(error.message));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Galeri</h1>
          <p className="text-sm text-neutral-500">Gezi albümlerini ve fotoğraflarını yönetin.</p>
        </div>
        <Link href="/yonetim/galeri/yeni">
          <Button className="bg-orange-600 text-white hover:bg-orange-700">+ Yeni albüm</Button>
        </Link>
      </div>

      {missing && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Galeri tabloları henüz yok. Supabase SQL Editor’da{" "}
          <span className="font-mono">supabase/migrations/0003_gallery.sql</span> dosyasını çalıştırın.
        </p>
      )}
      {error && !missing && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error.message}</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {albums.map((album) => (
          <Link
            key={album.id}
            href={`/yonetim/galeri/${album.id}`}
            className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-3 hover:border-orange-200"
          >
            <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
              {album.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={album.cover_image} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div>
              <h2 className="font-bold text-neutral-900">{album.title}</h2>
              <p className="text-xs text-orange-700">{relatedTitle(album.events)}</p>
              <p className="mt-2 text-xs text-neutral-500">{album.album_photos?.length ?? 0} fotoğraf</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
