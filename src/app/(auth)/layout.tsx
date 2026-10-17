import { Suspense } from "react";
import { SiteSearch } from "@/components/search/SiteSearch";
import { NavAuthSlot } from "@/components/auth/NavAuthSlot";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DeveloperMark } from "@/components/layout/DeveloperMark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-amber-50/40 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.18),transparent_40%),radial-gradient(circle_at_bottom,rgba(245,158,11,0.12),transparent_36%)] text-zinc-900 dark:bg-zinc-950 dark:bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.22),transparent_40%),radial-gradient(circle_at_bottom,rgba(234,88,12,0.16),transparent_36%)] dark:text-zinc-100">
      <SiteHeader>
        <SiteSearch />
        <Suspense fallback={<div className="h-8 w-16 animate-pulse rounded-full bg-neutral-100" />}>
          <NavAuthSlot size="xs" />
        </Suspense>
      </SiteHeader>
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-200/80 bg-white/90 p-6 text-zinc-900 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100">
          {children}
        </div>
      </div>
      <footer className="px-4 pb-6 text-center">
        <DeveloperMark />
      </footer>
    </div>
  );
}
