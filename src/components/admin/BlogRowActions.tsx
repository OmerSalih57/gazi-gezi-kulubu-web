"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteBlogPost } from "@/actions/blog";
import { Button } from "@/components/ui/button";

export function BlogRowActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const remove = async () => {
    if (!confirm(`“${title}” yazısını silmek istediğinize emin misiniz?`)) return;
    setPending(true);
    setError(null);
    const result = await deleteBlogPost(id);
    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Link href={`/yonetim/blog/${id}`} className="text-xs font-medium text-orange-700 hover:underline">
          Düzenle
        </Link>
        <Button type="button" size="xs" variant="outline" disabled={pending} onClick={remove}>
          Sil
        </Button>
      </div>
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}
