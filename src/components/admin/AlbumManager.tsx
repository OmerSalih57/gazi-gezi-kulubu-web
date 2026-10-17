"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addAlbumPhoto, deleteAlbum, deleteAlbumPhoto, updateAlbum } from "@/actions/gallery";
import { compressCoverImage } from "@/lib/images/compress-cover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AlbumPhoto } from "@/types/database";

type EventOption = { id: string; title: string };

export function AlbumManager({
  albumId,
  title,
  eventId,
  coverImage,
  events,
  photos,
}: {
  albumId: string;
  title: string;
  eventId: string | null;
  coverImage: string | null;
  events: EventOption[];
  photos: AlbumPhoto[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const run = async (task: () => Promise<{ ok: boolean; error?: string }>) => {
    setPending(true);
    setError(null);
    try {
      const result = await task();
      if (!result.ok) setError(result.error || "İşlem tamamlanamadı.");
      else router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "İşlem tamamlanamadı.");
    } finally {
      setPending(false);
    }
  };

  async function payload(form: HTMLFormElement, field: "cover" | "file") {
    const data = new FormData(form);
    const file = data.get(field);
    if (file instanceof File && file.size > 0) data.set(field, await compressCoverImage(file));
    return data;
  }

  return (
    <div className="space-y-8">
      <Link href="/yonetim/galeri" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Albümlere dön
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
        <p className="mt-1 text-sm text-neutral-500">Kapak, bağlı gezi ve albüm fotoğraflarını buradan yönetin.</p>
      </div>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <form
        className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          void run(async () => updateAlbum(await payload(form, "cover")));
        }}
      >
        <input type="hidden" name="id" value={albumId} />
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="album-title">Albüm başlığı</Label>
          <Input id="album-title" name="title" defaultValue={title} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="album-event">Bağlı gezi</Label>
          <select
            id="album-event"
            name="event_id"
            defaultValue={eventId ?? ""}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="">Geziye bağlı değil</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="album-cover-url">Kapak adresi</Label>
          <Input id="album-cover-url" name="cover_url" defaultValue={coverImage ?? ""} placeholder="https://" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="album-cover-file">veya kapak dosyası</Label>
          <Input id="album-cover-file" name="cover" type="file" accept="image/jpeg,image/png,image/webp" />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={pending} className="bg-orange-600 text-white hover:bg-orange-700">
            Albümü kaydet
          </Button>
        </div>
      </form>

      <form
        className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          void run(async () => {
            const result = await addAlbumPhoto(await payload(form, "file"));
            if (result.ok) form.reset();
            return result;
          });
        }}
      >
        <input type="hidden" name="album_id" value={albumId} />
        <div className="sm:col-span-2">
          <h2 className="text-lg font-bold text-neutral-900">Fotoğraf ekle</h2>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="photo-file">Dosya</Label>
          <Input id="photo-file" name="file" type="file" accept="image/jpeg,image/png,image/webp" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="photo-url">veya görsel adresi</Label>
          <Input id="photo-url" name="image_url" placeholder="https://" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="photo-caption">Kısa açıklama</Label>
          <Input id="photo-caption" name="caption" maxLength={200} />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={pending} className="bg-neutral-900 text-white">
            Fotoğrafı ekle
          </Button>
        </div>
      </form>

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {photos.map((photo) => (
          <li key={photo.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.image_url} alt={photo.caption || ""} className="h-40 w-full object-cover" />
            <div className="space-y-2 p-3">
              <p className="line-clamp-2 text-xs text-neutral-600">{photo.caption || "Açıklama yok"}</p>
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Bu fotoğraf albümden silinsin mi?")) return;
                  void run(() => deleteAlbumPhoto(photo.id, albumId));
                }}
              >
                Sil
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!confirm("Albüm ve içindeki fotoğraf kayıtları silinsin mi?")) return;
          void run(async () => {
            const result = await deleteAlbum(albumId);
            if (result.ok) router.push("/yonetim/galeri");
            return result;
          });
        }}
      >
        Albümü sil
      </Button>
    </div>
  );
}
