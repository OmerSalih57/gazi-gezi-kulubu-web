"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadReceipt, cancelMyRegistration } from "@/actions/registrations";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ReceiptUploadFormProps {
  registrationId: string;
  eventSlug: string;
  paymentInfo?: string | null;
  priceTry: number;
  status: string;
  adminNote?: string | null;
}

export function ReceiptUploadForm({
  registrationId,
  eventSlug,
  paymentInfo,
  priceTry,
  status,
  adminNote,
}: ReceiptUploadFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPendingCancel, startCancel] = useTransition();

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("registrationId", registrationId);
    formData.append("eventSlug", eventSlug);

    const res = await uploadReceipt(formData);

    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  };

  const handleCancel = () => {
    if (confirm("Bu gezi başvurunuzu iptal etmek istediğinize emin misiniz?")) {
      startCancel(async () => {
        const res = await cancelMyRegistration(registrationId, eventSlug);
        if (res.ok) {
          router.refresh();
        } else {
          setError(res.error);
        }
      });
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
      {/* Durum Başlığı */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Başvuru Durumu
          </span>
          {status === "pending_payment" && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              Ödeme ve Dekont Bekleniyor
            </span>
          )}
          {status === "receipt_uploaded" && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              Dekont İnceleniyor
            </span>
          )}
          {status === "rejected" && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
              Dekont Reddedildi
            </span>
          )}
        </div>

        {adminNote && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            <strong>Yönetici Notu:</strong> {adminNote}
          </div>
        )}
      </div>

      {/* IBAN ve Ödeme Bilgileri */}
      {paymentInfo && (
        <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-orange-950">
            <span>Banka & Ödeme Bilgileri</span>
            <span>{priceTry > 0 ? `${Number(priceTry).toLocaleString("tr-TR")} ₺` : "Ücretsiz"}</span>
          </div>
          <pre className="text-xs text-neutral-800 whitespace-pre-wrap font-sans leading-relaxed">
            {paymentInfo}
          </pre>
          <p className="text-[11px] text-orange-800 font-medium">
            * Lütfen havale/EFT açıklama kısmına Ad Soyad bilginizi yazmayı unutmayınız.
          </p>
        </div>
      )}

      {/* Dekont Yükleme Formu */}
      <form onSubmit={handleUpload} className="space-y-4">
        {error && (
          <div className="p-3 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-xs rounded-lg bg-green-50 border border-green-200 text-green-700">
            Dekont başarıyla yüklendi! Yönetici onayı bekleniyor.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="receipt-file" className="text-xs font-semibold text-neutral-700">
            {status === "receipt_uploaded" ? "Dekontu Güncelle (İsteğe Bağlı)" : "Dekont Dosyası (Görsel veya PDF) *"}
          </Label>
          <input
            id="receipt-file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            required={status !== "receipt_uploaded"}
            className="block w-full text-xs text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer border border-neutral-200 rounded-lg p-1.5"
          />
          <p className="text-[11px] text-neutral-400">
            Maksimum dosya boyutu 5 MB. JPG, PNG veya PDF kabul edilir.
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 text-xs"
        >
          {loading ? "Yükleniyor..." : status === "receipt_uploaded" ? "Dekontu Değiştir" : "Dekontu Gönder"}
        </Button>
      </form>

      {/* İptal Butonu */}
      <div className="pt-2 border-t flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={isPendingCancel}
          onClick={handleCancel}
          className="text-neutral-400 hover:text-red-600 hover:bg-red-50 text-xs"
        >
          {isPendingCancel ? "İptal Ediliyor..." : "Başvurumu İptal Et"}
        </Button>
      </div>
    </div>
  );
}

