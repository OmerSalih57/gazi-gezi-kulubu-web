"use client";

import { createContext, Suspense, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const HeaderToneContext = createContext<"light" | "onDark">("light");

export function HeaderToneProvider({
  tone,
  children,
}: {
  tone: "light" | "onDark";
  children: React.ReactNode;
}) {
  return <HeaderToneContext.Provider value={tone}>{children}</HeaderToneContext.Provider>;
}

export function useHeaderTone() {
  return useContext(HeaderToneContext);
}

export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const next = window.scrollY > threshold;
        setScrolled((current) => (current === next ? current : next));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  return scrolled;
}

export function headerShellClass(scrolled: boolean, floating: boolean) {
  const place = floating ? "fixed inset-x-0 top-0 z-40" : "sticky top-0 z-40";
  const base = `${place} border-b transition-all duration-300 ease-out`;
  if (scrolled) return `${base} backdrop-blur-lg bg-background/80 border-orange-500/10 shadow-sm`;
  if (floating) return `${base} border-transparent bg-transparent`;
  return `${base} border-transparent bg-background/45 backdrop-blur-sm`;
}

export function BrandMark({ onDark = false, href = "/" }: { onDark?: boolean; href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2">
      <span className="relative grid size-9 place-items-center">
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_8px_18px_-10px_rgba(249,115,22,0.95)] transition duration-500 ease-out group-hover:rotate-45 group-hover:scale-110 group-hover:shadow-[0_0_18px_rgba(249,115,22,0.6)]" />
        <span className="absolute inset-[3px] rounded-full border border-dashed border-white/75 transition duration-700 ease-out group-hover:-rotate-180" />
        <span className="relative text-sm font-black tracking-tight text-white transition duration-500 group-hover:scale-110">
          G
        </span>
      </span>
      <span className={`text-sm font-bold tracking-tight sm:text-base ${onDark ? "text-white" : "text-neutral-900 dark:text-zinc-100"}`}>
        Gazi Gezi Kulübü
      </span>
    </Link>
  );
}

export function GlowNav({
  links,
  onDark = false,
}: {
  links: { href: string; label: string; exact?: boolean }[];
  onDark?: boolean;
}) {
  return (
    <Suspense fallback={<nav className="h-8 w-40" aria-hidden />}>
      <GlowNavLinks links={links} onDark={onDark} />
    </Suspense>
  );
}

function GlowNavLinks({
  links,
  onDark = false,
}: {
  links: { href: string; label: string; exact?: boolean }[];
  onDark?: boolean;
}) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const active = links.find((link) =>
    link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`),
  )?.href;
  const marked = hovered ?? active ?? null;

  return (
    <nav className="flex flex-wrap items-center gap-0.5 py-1" onMouseLeave={() => setHovered(null)}>
      {links.map((link) => {
        const current = link.href === active;
        const show = link.href === marked;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            onMouseEnter={() => setHovered(link.href)}
            className={`relative px-2.5 py-1.5 text-xs font-semibold transition-colors duration-300 sm:px-3 sm:text-sm ${
              show
                ? onDark
                  ? "text-amber-300"
                  : "text-amber-600 dark:text-amber-300"
                : onDark
                  ? "text-white/80 hover:text-amber-300"
                  : "text-neutral-600 hover:text-amber-500 dark:text-zinc-300 dark:hover:text-amber-300"
            }`}
          >
            {show && (
              <>
                <motion.span
                  layoutId="nav-glow"
                  className={`absolute inset-0 rounded-full ${onDark ? "bg-white/15" : "bg-amber-500/10 dark:bg-white/10"}`}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
                <motion.span
                  layoutId="nav-line"
                  className="absolute inset-x-2 bottom-0.5 h-0.5 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.85)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              </>
            )}
            <span className="relative">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
