import { Suspense } from "react";
import { SiteSearch } from "@/components/search/SiteSearch";
import { NavAuthSlot } from "@/components/auth/NavAuthSlot";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DeveloperMark } from "@/components/layout/DeveloperMark";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.16),transparent_34%)] text-zinc-900 dark:bg-zinc-950 dark:bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_34%)] dark:text-zinc-100">
      <SiteHeader>
        <SiteSearch />
        <Suspense fallback={<div className="h-8 w-16 animate-pulse rounded-full bg-neutral-100" />}>
          <NavAuthSlot size="xs" />
        </Suspense>
      </SiteHeader>
      <div className="flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="py-12 text-center text-sm text-neutral-400">Yükleniyor...</div>}>
          {children}
        </Suspense>
      </div>
      <footer className="px-4 pb-6 text-center">
        <DeveloperMark />
      </footer>
    </div>
  );
}
