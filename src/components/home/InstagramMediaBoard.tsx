"use client";

import { useEffect, useRef, useState } from "react";
import { INSTAGRAM_URL, mockInstagramStream, type MockFrame } from "@/data/instagram";
import type { InstagramPost } from "@/lib/instagram-feed";

const stillMotion =
  "h-full w-full object-cover motion-safe:animate-[ig-boomerang_8s_ease-in-out_infinite]";

function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

function GlassCopy({
  kicker,
  title,
  caption,
}: {
  kicker: string;
  title: string;
  caption?: string;
}) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl border border-white/30 bg-white/15 p-3 text-white shadow-[0_12px_40px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md">
      <div className="flex items-center gap-2 text-amber-100">
        <InstagramMark />
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase">{kicker}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-base leading-snug font-black tracking-tight">{title}</p>
      {caption ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/80">{caption}</p> : null}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-950 transition duration-300 hover:bg-amber-300 hover:shadow-[0_0_22px_rgba(251,191,36,0.55)]"
      >
        Instagram’da Gör
      </a>
    </div>
  );
}

function FrameMedia({
  src,
  alt,
  videoUrl,
  animate = true,
}: {
  src: string;
  alt: string;
  videoUrl?: string | null;
  animate?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !videoUrl || broken) return;
    const start = () => {
      node.muted = true;
      node.defaultMuted = true;
      void node.play().catch(() => undefined);
    };
    start();
    node.addEventListener("canplay", start);
    return () => node.removeEventListener("canplay", start);
  }, [videoUrl, broken]);

  if (videoUrl && !broken) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={src || undefined}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          controls={false}
          aria-label={alt}
          onError={() => setBroken(true)}
          className="pointer-events-none h-full w-full object-cover [&::-webkit-media-controls]:hidden [&::-webkit-media-controls-start-playback-button]:hidden"
        />
      </div>
    );
  }

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${animate ? "transition-transform duration-700 ease-out group-hover:scale-[1.04]" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className={animate ? stillMotion : "h-full w-full object-cover"}
      />
    </div>
  );
}

function LiveCard({ post, onFocus }: { post: InstagramPost; onFocus: (src: string) => void }) {
  return (
    <article
      className="group relative min-h-[26rem] overflow-hidden rounded-[1.6rem] bg-neutral-950 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.85)]"
      onMouseEnter={() => onFocus(post.imageUrl)}
      onFocus={() => onFocus(post.imageUrl)}
    >
      <FrameMedia
        src={post.imageUrl}
        alt={post.caption}
        videoUrl={post.videoUrl}
        animate={!post.videoUrl && post.kind === "Gönderi"}
      />
      <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/10 to-neutral-950/20" />
      <GlassCopy kicker={post.kind} title={post.caption} />
    </article>
  );
}

function MockCard({
  title,
  caption,
  kicker,
  frames,
  play,
  cta,
  onFrame,
}: {
  title: string;
  caption: string;
  kicker: string;
  frames: MockFrame[];
  play?: boolean;
  cta?: boolean;
  onFrame: (src: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const frame = frames[index] ?? frames[0];

  function go(next: number) {
    const wrapped = (next + frames.length) % frames.length;
    setIndex(wrapped);
    onFrame(frames[wrapped].src);
  }

  if (cta) {
    return (
      <article
        className="group relative flex min-h-[26rem] flex-col items-center overflow-hidden rounded-[1.6rem] bg-[#0c1b3a] shadow-[0_22px_50px_-28px_rgba(15,23,42,0.85)]"
        onMouseEnter={() => onFrame(frame.src)}
      >
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.38),transparent_58%)] motion-safe:animate-[ig-drift_12s_ease-in-out_infinite]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame.src}
          alt={frame.alt}
          className="relative z-10 mt-14 size-28 rounded-full object-cover shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)] ring-2 ring-white/70 motion-safe:animate-[ig-boomerang_8s_ease-in-out_infinite]"
        />
        <GlassCopy kicker={kicker} title={title} caption={caption} />
      </article>
    );
  }

  return (
    <article
      className="group relative min-h-[26rem] overflow-hidden rounded-[1.6rem] bg-neutral-950 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.85)]"
      onMouseEnter={() => onFrame(frame.src)}
    >
      <FrameMedia src={frame.src} alt={frame.alt} animate={!play} />
      <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/5 to-neutral-950/25" />
      {frames.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Önceki kare"
            onClick={() => go(index - 1)}
            className="absolute top-1/2 left-3 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/40 text-lg text-white backdrop-blur transition hover:bg-amber-300 hover:text-neutral-950"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Sonraki kare"
            onClick={() => go(index + 1)}
            className="absolute top-1/2 right-3 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/40 text-lg text-white backdrop-blur transition hover:bg-amber-300 hover:text-neutral-950"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-52 z-20 flex justify-center gap-1.5" role="tablist" aria-label={`${title} kareleri`}>
            {frames.map((item, dot) => (
              <button
                key={item.src}
                type="button"
                role="tab"
                aria-label={`${dot + 1}. kare`}
                aria-selected={dot === index}
                onClick={() => go(dot)}
                className={`h-1.5 rounded-full transition ${dot === index ? "w-5 bg-amber-300" : "w-1.5 bg-white/70"}`}
              />
            ))}
          </div>
        </>
      )}
      <GlassCopy kicker={kicker} title={title} caption={caption} />
    </article>
  );
}

export function InstagramMediaBoard({ live }: { live: InstagramPost[] }) {
  const opening = live[0]?.imageUrl ?? mockInstagramStream[0].frames[0].src;
  const [ambient, setAmbient] = useState(opening);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/30 p-3 shadow-[0_30px_80px_-42px_rgba(15,23,42,0.65)] backdrop-blur-xl sm:p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 scale-125 bg-cover bg-center opacity-80 blur-3xl motion-safe:animate-[ig-drift_14s_ease-in-out_infinite]"
        style={{ backgroundImage: `url("${ambient}")` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-white/35 dark:bg-zinc-950/45" />
      <div className="relative grid gap-4 md:grid-cols-3">
        {live.length > 0
          ? live.map((post) => <LiveCard key={post.id} post={post} onFocus={setAmbient} />)
          : mockInstagramStream.map((card) => (
              <MockCard
                key={card.id}
                title={card.title}
                caption={card.caption}
                kicker={card.kicker}
                frames={card.frames}
                play={card.play}
                cta={card.cta}
                onFrame={setAmbient}
              />
            ))}
      </div>
    </div>
  );
}
