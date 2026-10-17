"use client";

import { useEffect, useState } from "react";

export type GalleryPhoto = {
  id: string;
  imageUrl: string;
  caption: string | null;
};

export type GalleryAlbum = {
  id: string;
  title: string;
  coverImage: string | null;
  eventTitle: string | null;
  photos: GalleryPhoto[];
};

export function GalleryGrid({ albums }: { albums: GalleryAlbum[] }) {
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const album = albums.find((item) => item.id === albumId) ?? null;
  const frames = album
    ? album.photos.length > 0
      ? album.photos
      : album.coverImage
        ? [{ id: "cover", imageUrl: album.coverImage, caption: album.title }]
        : []
    : [];
  const frame = frames[index];

  useEffect(() => {
    if (!album) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAlbumId(null);
      if (!frames.length) return;
      if (event.key === "ArrowRight") setIndex((current) => (current + 1) % frames.length);
      if (event.key === "ArrowLeft") setIndex((current) => (current - 1 + frames.length) % frames.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [album, frames.length]);

  const open = (id: string) => {
    setAlbumId(id);
    setIndex(0);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => open(item.id)}
            className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative h-52 bg-neutral-100">
              {item.coverImage || item.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.coverImage || item.photos[0].imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-full bg-linear-to-br from-orange-400 to-sky-700" />
              )}
              <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">
                {item.photos.length} fotoğraf
              </span>
            </div>
            <div className="space-y-1 p-4">
              <h2 className="text-base font-bold text-neutral-900">{item.title}</h2>
              {item.eventTitle && <p className="text-xs text-orange-700">{item.eventTitle}</p>}
            </div>
          </button>
        ))}
      </div>

      {album && frame && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${album.title} albümü`}
          onClick={() => setAlbumId(null)}
        >
          <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between text-white">
              <p className="text-sm font-semibold">
                {album.title} · {index + 1} / {frames.length}
              </p>
              <button type="button" onClick={() => setAlbumId(null)} className="rounded-full bg-white/10 px-3 py-1 text-sm">
                Kapat
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={frame.imageUrl} alt={frame.caption || album.title} className="max-h-[78vh] w-full rounded-2xl object-contain" />
            {frame.caption && <p className="mt-3 text-center text-sm text-white/80">{frame.caption}</p>}
            {frames.length > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIndex((current) => (current - 1 + frames.length) % frames.length)}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900"
                >
                  Önceki
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((current) => (current + 1) % frames.length)}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900"
                >
                  Sonraki
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
