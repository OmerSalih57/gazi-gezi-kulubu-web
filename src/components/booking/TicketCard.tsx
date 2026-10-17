"use client";

import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface TicketCardProps {
  token: string;
  name: string;
  title: string;
  date: string;
  checkedIn: boolean;
}

export function TicketCard({
  token,
  name,
  title,
  date,
  checkedIn,
}: TicketCardProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Yazdırılmayacak Butonlar */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/geziler"
          className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          ← Gezilere Dön
        </Link>
        <Button
          variant="outline"
          size="xs"
          onClick={handlePrint}
          className="text-xs font-medium"
        >
          🖨️ Yazdır / PDF Kaydet
        </Button>
      </div>

      {/* Bilet Kartı */}
      <div className="bg-white rounded-3xl overflow-hidden border border-neutral-200 shadow-xl transition-all">
        {/* Üst Kısım */}
        <div className="bg-orange-600 p-6 text-white text-center space-y-1 relative overflow-hidden">
          <div className="text-[11px] font-bold tracking-widest uppercase opacity-85">
            Gazi Üniversitesi Gezi Kulübü
          </div>
          <h1 className="text-2xl font-black tracking-tight">{title}</h1>
          <p className="text-xs opacity-90">
            {date
              ? new Date(date).toLocaleString("tr-TR", {
                  dateStyle: "full",
                  timeStyle: "short",
                })
              : "Tarih Belirtilmedi"}
          </p>
        </div>

        {/* Bilet Gövdesi ve QR Kodu */}
        <div className="p-8 flex flex-col items-center space-y-6">
          <div className="relative p-4 bg-neutral-50 rounded-2xl border border-neutral-200 shadow-inner">
            <QRCodeSVG
              value={token}
              size={210}
              level="M"
              includeMargin={false}
              className="rounded-lg"
            />
            {checkedIn && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center rounded-2xl p-4 text-center">
                <span className="size-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold mb-2">
                  ✓
                </span>
                <span className="text-base font-bold text-emerald-800">
                  Giriş Yapıldı
                </span>
                <span className="text-[11px] text-emerald-600 mt-1">
                  Yoklama başarıyla tamamlandı
                </span>
              </div>
            )}
          </div>

          <div className="text-center space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block">
              Katılımcı
            </span>
            <p className="text-lg font-extrabold text-neutral-900">{name}</p>
          </div>

          {/* Güvenlik Notu ve Perforasyon Hattı */}
          <div className="w-full pt-4 border-t border-dashed border-neutral-200 text-center">
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              Bu bilet, <strong>Gazi Gezi Kulübü</strong> tarafından adınıza özel kriptografik olarak imzalanmıştır. Etkinlik alanına girişte görevliye QR kodu okutunuz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketCard;

