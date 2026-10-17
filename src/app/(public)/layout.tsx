import Link from "next/link";
import { Suspense } from "react";
import { SiteSearch } from "@/components/search/SiteSearch";
import { NavAuthSlot } from "@/components/auth/NavAuthSlot";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DeveloperMark } from "@/components/layout/DeveloperMark";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/data/instagram";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_32%)] text-zinc-900 dark:bg-zinc-950 dark:bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(234,88,12,0.12),transparent_32%)] dark:text-zinc-100">
      <SiteHeader>
        <SiteSearch />
        <Suspense fallback={<div className="h-8 w-16 animate-pulse rounded-full bg-neutral-100" />}>
          <NavAuthSlot size="xs" />
        </Suspense>
      </SiteHeader>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="py-12 text-center text-sm text-neutral-400">Yükleniyor...</div>}>
          {children}
        </Suspense>
      </main>
      <footer className="border-t border-white/70 bg-white/70 py-6 text-center text-xs text-neutral-500 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:flex-wrap sm:px-6 lg:px-8">
          <span>© 2026 Gazi Gezi Kulübü. Tüm hakları saklıdır.</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/geziler" className="hover:underline">
              Geziler
            </Link>
            <Link href="/blog" className="hover:underline">
              Rehberler
            </Link>
            <Link href="/galeri" className="hover:underline">
              Galeri
            </Link>
            <Link href="/hakkimizda" className="hover:underline">
              Hakkımızda
            </Link>
            <Link href="/yarisma" className="hover:underline">
              Yarışma
            </Link>
            <Link href="/basvuru" className="hover:underline">
              Ekip Başvurusu
            </Link>
            <Link href="/giris" className="hover:underline">
              Üye Girişi
            </Link>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="hover:underline">
              @{INSTAGRAM_HANDLE}
            </a>
          </div>
        </div>
        <div className="mt-4">
          <DeveloperMark />
        </div>
      </footer>
    </div>
  );
}

