import { Suspense } from "react";
import { SiteSearch } from "@/components/search/SiteSearch";
import { NavAuthSlot } from "@/components/auth/NavAuthSlot";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { HomeFeed } from "@/components/home/HomeFeed";
import { DeveloperMark } from "@/components/layout/DeveloperMark";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/data/instagram";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <SiteHeader floating>
        <SiteSearch />
        <Suspense fallback={<div className="h-8 w-16 animate-pulse rounded-full bg-white/10" />}>
          <NavAuthSlot size="sm" />
        </Suspense>
      </SiteHeader>

      <main>
        <Suspense
          fallback={
            <div className="flex min-h-[70vh] items-center justify-center bg-neutral-950 text-sm text-white/70">
              Rotalar hazırlanıyor...
            </div>
          }
        >
          <HomeFeed />
        </Suspense>
      </main>

      <footer className="border-t border-zinc-200 bg-white/90 py-6 text-center text-xs text-neutral-500 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400">
        <p>© 2026 Gazi Gezi Kulübü Platformu. Tüm hakları saklıdır.</p>
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="mt-2 inline-flex font-semibold text-neutral-700 hover:text-orange-600 dark:text-zinc-200 dark:hover:text-amber-300">
          @{INSTAGRAM_HANDLE}
        </a>
        <div className="mt-3">
          <DeveloperMark />
        </div>
      </footer>
    </div>
  );
}
