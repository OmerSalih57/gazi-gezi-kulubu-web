"use client";

import { useEffect, useState } from "react";

export function DeveloperMark() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-neutral-950 px-3 py-1 text-[11px] font-medium tracking-wide text-white/65 transition hover:border-orange-400/40 hover:text-orange-100"
      >
        <span className="size-1.5 rounded-full bg-orange-400/80" aria-hidden />
        Geliştirici: Ömer Salih Aydın
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-950/55 p-4 sm:items-center"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="developer-credit"
            className="w-full max-w-sm rounded-[1.6rem] border border-white/10 bg-neutral-950 p-6 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300">İmza</p>
            <h2 id="developer-credit" className="mt-3 text-xl font-semibold tracking-tight">
              Geliştirici: Ömer Salih Aydın
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Gazi Gezi Kulübü platformunun arayüzü, yarışması ve yönetim akışı bu imzayla duruyor.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </>
  );
}
