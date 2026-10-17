import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventRowActions } from "@/components/admin/EventRowActions";
import type { EventStatus, EventItem } from "@/types/database";

function StatusBadge({ status }: { status: EventStatus }) {
  switch (status) {
    case "open":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Kayıtlar Açık
        </span>
      );
    case "closed":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          Kayıtlar Kapalı
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Tamamlandı
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
          İptal Edildi
        </span>
      );
    case "draft":
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-200 text-neutral-800">
          Taslak
        </span>
      );
  }
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("tr-TR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dateStr;
  }
}

export default async function AdminEventsPage() {
  const supabase = await createClient();

  const { data: rawEvents, error } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false });

  const events = rawEvents as EventItem[] | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Geziler</h1>
          <p className="text-sm text-neutral-500">
            Kulüp gezi ve etkinliklerinin listesi ve durum yönetimi
          </p>
        </div>
        <Link href="/yonetim/geziler/yeni">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white font-medium">
            + Yeni Gezi Oluştur
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          Geziler yüklenirken bir hata oluştu: {error.message}
        </div>
      )}

      {!events || events.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center space-y-4">
          <div className="mx-auto size-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 text-xl">
            📅
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-900">Henüz Gezi Eklenmemiş</h3>
            <p className="text-sm text-neutral-500 mt-1">
              İlk gezinizi ekleyerek kulüp üyelerine duyurmaya başlayabilirsiniz.
            </p>
          </div>
          <Link href="/yonetim/geziler/yeni">
            <Button variant="outline">Yeni Gezi Oluştur</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50/75 hover:bg-neutral-50/75">
                <TableHead className="font-semibold text-neutral-700">Gezi Adı</TableHead>
                <TableHead className="font-semibold text-neutral-700">Tarih</TableHead>
                <TableHead className="font-semibold text-neutral-700">Kontenjan</TableHead>
                <TableHead className="font-semibold text-neutral-700">Ücret</TableHead>
                <TableHead className="font-semibold text-neutral-700">Durum</TableHead>
                <TableHead className="font-semibold text-neutral-700 text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id} className="hover:bg-neutral-50/50">
                  <TableCell className="font-medium text-neutral-900">
                    <div>{event.title}</div>
                    <div className="text-xs text-neutral-400 font-mono">/{event.slug}</div>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-600">
                    <div>{formatDate(event.starts_at)}</div>
                    {event.ends_at && (
                      <div className="text-xs text-neutral-400">Bitiş: {formatDate(event.ends_at)}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-600">
                    {event.capacity} Kişi
                  </TableCell>
                  <TableCell className="text-sm font-medium text-neutral-900">
                    {event.price_try === 0 ? "Ücretsiz" : `${Number(event.price_try).toLocaleString("tr-TR")} ₺`}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={event.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <EventRowActions id={event.id} currentStatus={event.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
