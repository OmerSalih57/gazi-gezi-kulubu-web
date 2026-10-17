import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/guards";
import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { DeveloperMark } from "@/components/layout/DeveloperMark";

async function AdminHeader() {
  const { profile } = await requireAdmin();
  return <AdminTopBar name={profile.full_name} />;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Suspense fallback={<div className="h-12 border-b bg-white" />}>
        <AdminHeader />
      </Suspense>
      <main className="mx-auto max-w-6xl w-full flex-1 p-6">
        <Suspense fallback={<div className="py-8 text-sm text-neutral-500">Yükleniyor...</div>}>
          {children}
        </Suspense>
      </main>
      <footer className="px-4 pb-6 text-center">
        <DeveloperMark />
      </footer>
    </div>
  );
}

