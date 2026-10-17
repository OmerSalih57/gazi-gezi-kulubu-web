"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateEvent } from "@/actions/events";
import { slugify, type EventInput } from "@/lib/validations/event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EventStatus } from "@/types/database";

export type EventEditValues = {
  title: string;
  slug: string;
  description: string;
  cover_url: string;
  starts_at: string;
  ends_at: string;
  registration_deadline: string;
  price_try: number;
  capacity: number;
  payment_info: string;
  status: EventStatus;
  itinerary_text: string;
  highlights_text: string;
};

export function EventEditForm({
  eventId,
  initial,
}: {
  eventId: string;
  initial: EventEditValues;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [description, setDescription] = useState(initial.description);
  const [coverUrl, setCoverUrl] = useState(initial.cover_url);
  const [startsAt, setStartsAt] = useState(initial.starts_at);
  const [endsAt, setEndsAt] = useState(initial.ends_at);
  const [registrationDeadline, setRegistrationDeadline] = useState(initial.registration_deadline);
  const [priceTry, setPriceTry] = useState<number | string>(initial.price_try);
  const [capacity, setCapacity] = useState<number | string>(initial.capacity);
  const [status, setStatus] = useState<EventStatus>(initial.status);
  const [paymentInfo, setPaymentInfo] = useState(initial.payment_info);
  const [itineraryText, setItineraryText] = useState(initial.itinerary_text);
  const [highlightsText, setHighlightsText] = useState(initial.highlights_text);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const input: EventInput = {
      title,
      slug: slug || slugify(title),
      description: description || undefined,
      cover_url: coverUrl || undefined,
      starts_at: startsAt,
      ends_at: endsAt || undefined,
      registration_deadline: registrationDeadline || undefined,
      price_try: Number(priceTry) || 0,
      capacity: Number(capacity) || 1,
      payment_info: paymentInfo || undefined,
      status,
      itinerary_text: itineraryText,
      highlights_text: highlightsText,
    };

    const res = await updateEvent(eventId, input);

    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    router.push("/yonetim/geziler");
    router.refresh();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/yonetim/geziler"
          className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1"
        >
          ← Geziler Listesine Dön
        </Link>
      </div>

      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Geziyi Düzenle</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Başlık, tarih, kontenjan ve yayın durumunu güncelleyin. Mevcut başvurular silinmez.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <strong>Hata:</strong> {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-neutral-700">
              Gezi Başlığı *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-neutral-700">
              URL Slug *
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
            <p className="text-xs text-neutral-400">Site adresi: /geziler/{slug || "slug-adresi"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startsAt" className="text-neutral-700">
              Başlangıç Tarihi ve Saati *
            </Label>
            <Input
              id="startsAt"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endsAt" className="text-neutral-700">
              Bitiş Tarihi ve Saati
            </Label>
            <Input
              id="endsAt"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrationDeadline" className="text-neutral-700">
              Son Kayıt Tarihi
            </Label>
            <Input
              id="registrationDeadline"
              type="datetime-local"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="capacity" className="text-neutral-700">
              Kontenjan (Kişi) *
            </Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceTry" className="text-neutral-700">
              Ücret (₺) *
            </Label>
            <Input
              id="priceTry"
              type="number"
              min={0}
              step="0.01"
              value={priceTry}
              onChange={(e) => setPriceTry(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-neutral-700">
              Yayın Durumu *
            </Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus)}
              className="h-8 w-full rounded-lg border border-neutral-300 bg-transparent px-2.5 py-1 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="draft">Taslak (Yayında Değil)</option>
              <option value="open">Açık (Başvuruya Açık)</option>
              <option value="closed">Kapalı (Başvuruya Kapalı)</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverUrl" className="text-neutral-700">
            Kapak Görseli URL
          </Label>
          <Input
            id="coverUrl"
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentInfo" className="text-neutral-700">
            Ödeme & IBAN Bilgisi
          </Label>
          <Textarea
            id="paymentInfo"
            value={paymentInfo}
            onChange={(e) => setPaymentInfo(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="itinerary" className="text-neutral-700">
            Gün akışı
          </Label>
          <Textarea
            id="itinerary"
            value={itineraryText}
            onChange={(e) => setItineraryText(e.target.value)}
            rows={4}
            placeholder={"08:00 | Hareket | Ankara buluşma\n14:30 | Varış | İlk durak"}
          />
          <p className="text-[11px] text-neutral-400">Her satır: saat | başlık | açıklama</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="highlights" className="text-neutral-700">
            Rota durakları
          </Label>
          <Textarea
            id="highlights"
            value={highlightsText}
            onChange={(e) => setHighlightsText(e.target.value)}
            rows={3}
            placeholder={"Göreme | Vadi yürüyüşü\nUçhisar | Gün batımı"}
          />
          <p className="text-[11px] text-neutral-400">Her satır: durak | kısa not</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-neutral-700">
            Gezi Detayları ve Programı
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Link href="/yonetim/geziler">
            <Button type="button" variant="outline" disabled={loading}>
              İptal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white min-w-32"
          >
            {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
}
