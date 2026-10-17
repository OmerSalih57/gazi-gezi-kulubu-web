"use client";

import { useState, useTransition } from "react";
import { approveRegistration, rejectRegistration } from "@/actions/registrations";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ReviewItem {
  id: string;
  full_name: string;
  tc_no: string | null;
  phone: string | null;
  student_no: string | null;
  status: string;
  receipt_path: string | null;
  receipt_url: string | null;
  admin_note: string | null;
  created_at: string;
  event: {
    id: string;
    title: string;
    price_try: number;
    starts_at: string;
  } | null;
}

export function ReceiptReviewTable({ items }: { items: ReviewItem[] }) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    if (filter === "pending") return item.status === "receipt_uploaded";
    if (filter === "approved") return item.status === "approved";
    if (filter === "rejected") return item.status === "rejected";
    return true;
  });

  const handleApprove = (id: string) => {
    if (!confirm("Bu dekontu ve başvuruyu onaylamak istediğinize emin misiniz? Bilet oluşturulacaktır.")) {
      return;
    }
    setActiveId(id);
    startTransition(async () => {
      await approveRegistration(id);
      setActiveId(null);
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt("Lütfen red gerekçesini yazınız (öğrenciye iletilecektir):", "Dekont tutarı veya bilgileri eşleşmiyor");
    if (reason === null) return;
    setActiveId(id);
    startTransition(async () => {
      await rejectRegistration(id, reason);
      setActiveId(null);
    });
  };

  return (
    <div className="space-y-4">
      {/* Filtreleme Butonları */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="xs"
          onClick={() => setFilter("pending")}
          className={filter === "pending" ? "bg-orange-600 text-white" : ""}
        >
          Onay Bekleyenler ({items.filter((i) => i.status === "receipt_uploaded").length})
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="xs"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-neutral-900 text-white" : ""}
        >
          Tüm Başvurular ({items.length})
        </Button>
        <Button
          variant={filter === "approved" ? "default" : "outline"}
          size="xs"
          onClick={() => setFilter("approved")}
          className={filter === "approved" ? "bg-emerald-600 text-white" : ""}
        >
          Onaylananlar ({items.filter((i) => i.status === "approved").length})
        </Button>
        <Button
          variant={filter === "rejected" ? "default" : "outline"}
          size="xs"
          onClick={() => setFilter("rejected")}
          className={filter === "rejected" ? "bg-rose-600 text-white" : ""}
        >
          Reddedilenler ({items.filter((i) => i.status === "rejected").length})
        </Button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200 text-neutral-500">
          Bu filtreye uygun başvuru kaydı bulunmuyor.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50/75">
                <TableHead className="font-semibold text-neutral-700">Öğrenci Bilgileri</TableHead>
                <TableHead className="font-semibold text-neutral-700">Gezi / Tutar</TableHead>
                <TableHead className="font-semibold text-neutral-700">Dekont Dosyası</TableHead>
                <TableHead className="font-semibold text-neutral-700">Durum</TableHead>
                <TableHead className="font-semibold text-neutral-700 text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-neutral-50/50">
                  <TableCell>
                    <div className="font-semibold text-neutral-900 text-sm">{item.full_name}</div>
                    <div className="text-xs text-neutral-500 font-mono mt-0.5">
                      TC: {item.tc_no || "-"} | Tel: {item.phone || "-"}
                    </div>
                    {item.student_no && (
                      <div className="text-[11px] text-neutral-400">Öğr No: {item.student_no}</div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm font-medium text-neutral-800">
                      {item.event?.title ?? "Bilinmeyen Gezi"}
                    </div>
                    <div className="text-xs font-semibold text-neutral-600 mt-0.5">
                      {item.event?.price_try === 0 ? "Ücretsiz" : `${Number(item.event?.price_try).toLocaleString("tr-TR")} ₺`}
                    </div>
                  </TableCell>

                  <TableCell>
                    {item.receipt_url ? (
                      <a
                        href={item.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                      >
                        📄 Dekontu Gör ↗
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400 italic">Yüklenmedi</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {item.status === "receipt_uploaded" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        Onay Bekliyor
                      </span>
                    )}
                    {item.status === "approved" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Onaylandı
                      </span>
                    )}
                    {item.status === "rejected" && (
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          Reddedildi
                        </span>
                        {item.admin_note && (
                          <div className="text-[11px] text-rose-600 mt-1 max-w-xs">{item.admin_note}</div>
                        )}
                      </div>
                    )}
                    {item.status === "pending_payment" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">
                        Ödeme Bekleniyor
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="xs"
                        disabled={isPending && activeId === item.id}
                        onClick={() => handleApprove(item.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5"
                      >
                        Onayla
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={isPending && activeId === item.id}
                        onClick={() => handleReject(item.id)}
                        className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs px-2.5"
                      >
                        Reddet
                      </Button>
                    </div>
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

