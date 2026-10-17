"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/admin/QrScanner";
import { manualCheckInRegistration } from "@/actions/registrations";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AttendancePassenger {
  id: string;
  full_name: string;
  tc_no: string | null;
  phone: string | null;
  student_no: string | null;
  checked_in_at: string | null;
}

interface AttendanceManagerProps {
  eventId: string;
  eventTitle: string;
  passengers: AttendancePassenger[];
}

export function AttendanceManager({
  eventId,
  eventTitle,
  passengers,
}: AttendanceManagerProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"camera" | "list">("camera");
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [manualQuery, setManualQuery] = useState("");
  const [manualMessage, setManualMessage] = useState<string | null>(null);

  const checkedInCount = passengers.filter((p) => !!p.checked_in_at).length;
  const totalCount = passengers.length;
  const percentage = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  const filteredPassengers = passengers.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.tc_no && p.tc_no.includes(search)) ||
      (p.phone && p.phone.includes(search))
  );

  const manualQueryTrimmed = manualQuery.trim();
  const manualMatches =
    manualQueryTrimmed.length < 3
      ? []
      : passengers.filter((passenger) => {
          const query = manualQueryTrimmed.toLowerCase();
          const digits = query.replace(/\D/g, "");
          const tcMatch = Boolean(digits && passenger.tc_no?.includes(digits));
          const ticketMatch = passenger.id.toLowerCase().includes(query);
          return tcMatch || ticketMatch;
        });

  const handleManualCheckIn = (regId: string) => {
    setManualMessage(null);
    startTransition(async () => {
      const result = await manualCheckInRegistration(regId, eventId);
      if (!result.ok) {
        setManualMessage(result.error);
        return;
      }
      setManualMessage("Yoklama kaydedildi.");
      setManualQuery("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {/* İlerleme ve İstatistik Çubuğu */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Yoklama Durumu
            </span>
            <div className="text-xl font-black text-neutral-900 mt-0.5">
              {checkedInCount} / {totalCount} Katılımcı Giriş Yaptı (%{percentage})
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/export/${eventId}`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              📊 Excel İndir (.xlsx)
            </a>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex items-center gap-2 border-b pb-2">
        <Button
          variant={tab === "camera" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("camera")}
          className={tab === "camera" ? "bg-orange-600 text-white text-xs" : "text-xs"}
        >
          📷 Kamera ile QR Okut
        </Button>
        <Button
          variant={tab === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("list")}
          className={tab === "list" ? "bg-orange-600 text-white text-xs" : "text-xs"}
        >
          📋 Yolcu Listesi & Elle Yoklama ({passengers.length})
        </Button>
      </div>

      {/* Sekme 1: Kamera */}
      {tab === "camera" && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs text-center space-y-4">
          <p className="text-xs text-neutral-500">
            Öğrencinin telefonundaki QR kodu kamera çerçevesine yaklaştırınız.
          </p>
          <QrScanner
            eventId={eventId}
            onScanSuccess={() => {
              router.refresh();
            }}
          />

          <div className="mx-auto max-w-md space-y-3 border-t border-neutral-100 pt-4 text-left">
            <div>
              <p className="text-sm font-semibold text-neutral-900">Kamera açılmazsa elle yoklama</p>
              <p className="text-xs text-neutral-500 mt-1">
                Yolcuyu T.C. kimlik numarası veya bilet numarasıyla arayıp girişi işaretleyin.
              </p>
            </div>
            <input
              type="search"
              value={manualQuery}
              onChange={(event) => setManualQuery(event.target.value)}
              placeholder="T.C. kimlik no veya bilet no"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
            {manualMessage && <p className="text-xs font-medium text-neutral-600">{manualMessage}</p>}
            {manualQueryTrimmed.length >= 3 && manualMatches.length === 0 && (
              <p className="text-xs text-neutral-400">Bu gezi için eşleşen yolcu bulunamadı.</p>
            )}
            {manualMatches.length > 0 && (
              <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
                {manualMatches.map((passenger) => {
                  const checkedIn = Boolean(passenger.checked_in_at);
                  return (
                    <li key={passenger.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0 text-left">
                        <p className="truncate text-sm font-semibold text-neutral-900">{passenger.full_name}</p>
                        <p className="font-mono text-[11px] text-neutral-500">
                          {passenger.tc_no || "T.C. yok"} · {passenger.id.slice(0, 8)}
                        </p>
                      </div>
                      {checkedIn ? (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          Giriş yaptı
                        </span>
                      ) : (
                        <Button
                          size="xs"
                          disabled={isPending}
                          onClick={() => handleManualCheckIn(passenger.id)}
                          className="shrink-0 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                        >
                          Yoklama al
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Sekme 2: Yolcu Listesi */}
      {tab === "list" && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim, TC veya telefonla ara..."
              className="text-xs border border-neutral-300 rounded-lg px-3 py-2 w-full max-w-sm outline-none focus:border-orange-500"
            />
            <span className="text-xs text-neutral-400 whitespace-nowrap">
              {filteredPassengers.length} kişi gösteriliyor
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50/75">
                  <TableHead className="font-semibold text-neutral-700">Ad Soyad</TableHead>
                  <TableHead className="font-semibold text-neutral-700">T.C. / Telefon</TableHead>
                  <TableHead className="font-semibold text-neutral-700">Öğr. No</TableHead>
                  <TableHead className="font-semibold text-neutral-700">Durum</TableHead>
                  <TableHead className="font-semibold text-neutral-700 text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPassengers.map((p) => {
                  const isCheckedIn = !!p.checked_in_at;
                  return (
                    <TableRow key={p.id} className="hover:bg-neutral-50/50">
                      <TableCell className="font-semibold text-sm text-neutral-900">
                        {p.full_name}
                      </TableCell>
                      <TableCell className="text-xs text-neutral-600 font-mono">
                        <div>{p.tc_no || "-"}</div>
                        <div className="text-neutral-400">{p.phone || "-"}</div>
                      </TableCell>
                      <TableCell className="text-xs text-neutral-600">
                        {p.student_no || "-"}
                      </TableCell>
                      <TableCell>
                        {isCheckedIn ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            ✓ Giriş Yaptı
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-500">
                            Bekliyor
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isCheckedIn ? (
                          <Button
                            size="xs"
                            disabled={isPending}
                            onClick={() => handleManualCheckIn(p.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5"
                          >
                            İşaretle
                          </Button>
                        ) : (
                          <span className="text-[11px] text-neutral-400">
                            {new Date(p.checked_in_at!).toLocaleTimeString("tr-TR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceManager;

