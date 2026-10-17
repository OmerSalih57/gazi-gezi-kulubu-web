"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { updateEventStatus, deleteEvent } from "@/actions/events";
import { Button } from "@/components/ui/button";
import type { EventStatus } from "@/types/database";

export function EventRowActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: EventStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = (status: EventStatus) => {
    setError(null);
    startTransition(async () => {
      const res = await updateEventStatus(id, status);
      if (!res.ok) setError(res.error);
    });
  };

  const handleDelete = () => {
    if (!confirm("Bu geziyi silmek istediğinize emin misiniz?")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteEvent(id);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <Link href={`/yonetim/geziler/${id}`}>
          <Button variant="outline" size="xs" className="text-xs">
            Düzenle
          </Button>
        </Link>
        <Link href={`/yonetim/yoklama/${id}`}>
          <Button variant="outline" size="xs" className="text-xs">
            Yoklama
          </Button>
        </Link>
        <select
          value={currentStatus}
          disabled={isPending}
          onChange={(e) => handleStatusChange(e.target.value as EventStatus)}
          className="text-xs border border-neutral-300 rounded px-2 py-1 bg-white text-neutral-800 cursor-pointer disabled:opacity-50"
        >
          <option value="draft">Taslak</option>
          <option value="open">Açık</option>
          <option value="closed">Kapalı</option>
          <option value="completed">Tamamlandı</option>
          <option value="cancelled">İptal</option>
        </select>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={isPending}
          onClick={handleDelete}
        >
          Sil
        </Button>
      </div>
      {error && <p className="max-w-64 text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}

