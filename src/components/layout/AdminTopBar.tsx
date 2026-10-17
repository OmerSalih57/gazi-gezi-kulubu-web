"use client";

import Link from "next/link";
import { BrandMark, GlowNav, headerShellClass, useScrolled } from "@/components/layout/header-motion";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const LINKS = [
  { href: "/yonetim", label: "Genel Bakış", exact: true },
  { href: "/yonetim/geziler", label: "Geziler" },
  { href: "/yonetim/dekontlar", label: "Dekont Onayları" },
  { href: "/yonetim/blog", label: "Blog" },
  { href: "/yonetim/galeri", label: "Galeri" },
  { href: "/yonetim/basvurular", label: "Başvurular" },
];

export function AdminTopBar({ name }: { name: string }) {
  const scrolled = useScrolled();

  return (
    <header className={headerShellClass(scrolled, false)}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5">
        <BrandMark href="/yonetim" />
        <div className="order-3 flex w-full justify-center md:order-none md:w-auto">
          <GlowNav links={LINKS} />
        </div>
        <div className="flex items-center gap-3 text-sm">
          <ThemeToggle />
          <Link href="/profil" className="hidden text-sm font-semibold text-neutral-800 underline-offset-4 hover:text-amber-500 hover:underline sm:inline dark:text-zinc-100">
            {name}
          </Link>
          <Link
            href="/"
            className="rounded-full bg-gradient-to-r from-orange-500 via-amber-200 to-orange-500 p-px text-xs font-semibold transition hover:shadow-[0_0_18px_rgba(249,115,22,0.45)]"
          >
            <span className="block rounded-full bg-background/95 px-3 py-1.5 text-orange-700">Siteye Dön</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
