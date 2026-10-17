"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useHeaderTone } from "@/components/layout/header-motion";

type Hit = { href: string; title: string; meta: string };

type Payload = {
  trips: { title: string; slug: string }[];
  posts: { title: string; slug: string; category: string }[];
  albums: { id: string; title: string }[];
};

export function SiteSearch({ tone }: { tone?: "light" | "onDark" }) {
  const headerTone = useHeaderTone();
  const resolved = tone ?? headerTone;
  const router = useRouter();
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [groups, setGroups] = useState<{ label: string; items: Hit[] }[]>([]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const text = query.trim();
    if (text.length < 2) {
      setGroups([]);
      setSearched(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(text)}`);
        const data = (await response.json()) as Payload;
        setGroups([
          { label: "Geziler", items: data.trips.map((item) => ({ href: `/geziler/${item.slug}`, title: item.title, meta: "Gezi" })) },
          { label: "Rehberler", items: data.posts.map((item) => ({ href: `/blog/${item.slug}`, title: item.title, meta: item.category })) },
          { label: "Albümler", items: data.albums.map((item) => ({ href: "/galeri", title: item.title, meta: "Galeri" })) },
        ].filter((group) => group.items.length > 0));
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-gradient-to-r from-orange-500 via-amber-200 to-orange-500 p-px text-xs font-semibold transition duration-300 hover:shadow-[0_0_18px_rgba(249,115,22,0.45)]"
      >
        <span
          className={`block rounded-full px-3 py-1.5 ${
            resolved === "onDark" ? "bg-neutral-950/45 text-white" : "bg-background/95 text-neutral-800 dark:bg-zinc-900/90 dark:text-zinc-100"
          }`}
        >
          Ara
        </span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-950/50 p-4 pt-[12vh] backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={fieldId}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.65)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90"
            onClick={(event) => event.stopPropagation()}
          >
            <label htmlFor={fieldId} className="sr-only">
              Gezi, rehber veya albüm ara
            </label>
            <input
              id={fieldId}
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Gezi, rehber veya albüm ara"
              className="w-full border-b border-neutral-200/80 bg-transparent px-5 py-4 text-base text-zinc-900 outline-none placeholder:text-neutral-400 dark:border-zinc-800 dark:text-zinc-100"
            />
            <div className="max-h-80 overflow-y-auto p-3">
              {query.trim().length < 2 && <p className="px-2 py-6 text-sm text-neutral-500">En az iki karakter yazın.</p>}
              {loading && <p className="px-2 py-6 text-sm text-neutral-500">Aranıyor...</p>}
              {!loading && searched && groups.length === 0 && (
                <p className="px-2 py-6 text-sm text-neutral-500">Eşleşen kayıt yok.</p>
              )}
              {groups.map((group) => (
                <div key={group.label} className="mb-3">
                  <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-600">{group.label}</p>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.href + item.title}>
                        <button
                          type="button"
                          onClick={() => go(item.href)}
                          className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left hover:bg-orange-50 dark:hover:bg-zinc-800"
                        >
                          <span className="text-sm font-semibold text-neutral-900 dark:text-zinc-100">{item.title}</span>
                          <span className="text-[11px] text-neutral-400">{item.meta}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
