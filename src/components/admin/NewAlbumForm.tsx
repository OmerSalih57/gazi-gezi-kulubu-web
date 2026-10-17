"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAlbum } from "@/actions/gallery";
import { compressCoverImage, withTimeout } from "@/lib/images/compress-cover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewAlbumForm({ events }: { events: { id: string; title: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mx-auto max-w-2xl space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setPending(true);
        setError(null);
        try {
          const data = new FormData(form);
          const cover = data.get("cover");
          if (cover instanceof File && cover.size > 0) {
            data.set("cover", await compressCoverImage(cover));
          }
          const result = await withTimeout(
            createAlbum(data),
            45_000,
            "Kayıt zaman aşımına uğradı. Kapak dosyasını küçültüp yeniden deneyin.",
          );
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(`/yonetim/galeri/${result.id}`);
          router.refresh();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Albüm kaydedilemedi. Lütfen yeniden deneyin.");
        } finally {
          setPending(false);
        }
      }}
    >
      <Link href="/yonetim/galeri" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Albümlere dön
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Yeni albüm</h1>
        <p className="mt-1 text-sm text-neutral-500">Albümü bir geziye bağlayabilir, kapağı dosya ya da adres olarak ekleyebilirsiniz.</p>
      </div>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="space-y-1.5">
        <Label htmlFor="new-title">Başlık *</Label>
        <Input id="new-title" name="title" required minLength={3} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-event">Gezi</Label>
        <select id="new-event" name="event_id" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm">
          <option value="">Geziye bağlı değil</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-cover-url">Kapak adresi</Label>
        <Input id="new-cover-url" name="cover_url" placeholder="https://" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-cover-file">Kapak dosyası</Label>
        <Input id="new-cover-file" name="cover" type="file" accept="image/jpeg,image/png,image/webp" />
      </div>
      <Button type="submit" disabled={pending} className="bg-orange-600 text-white hover:bg-orange-700">
        {pending ? "Kaydediliyor..." : "Albümü oluştur"}
      </Button>
    </form>
  );
}
