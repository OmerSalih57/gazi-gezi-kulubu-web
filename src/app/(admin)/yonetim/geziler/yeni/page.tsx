"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEvent } from "@/actions/events";
import { slugify, type EventInput } from "@/lib/validations/event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewEventPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);

  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [priceTry, setPriceTry] = useState<number | string>(0);
  const [capacity, setCapacity] = useState<number | string>(46);
  const [status, setStatus] = useState<"draft" | "open" | "closed">("draft");
  const [paymentInfo, setPaymentInfo] = useState("");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugCustomized) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugCustomized(true);
    setSlug(val);
  };

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
    };

    const res = await createEvent(input);

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
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Yeni Gezi Oluştur</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Yeni bir gezi veya etkinlik kaydı oluşturarak katılımcılara sunun.
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
        {/* Başlık ve Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-neutral-700">
              Gezi Başlığı *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Örn: Kapadokya Bahar Gezisi"
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
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="kapadokya-bahar-gezisi"
              required
            />
            <p className="text-xs text-neutral-400">
              Site adresi: /geziler/{slug || "slug-adresi"}
            </p>
          </div>
        </div>

        {/* Tarihler */}
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

        {/* Kontenjan, Ücret ve Durum */}
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
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "open" | "closed")
              }
              className="h-8 w-full rounded-lg border border-neutral-300 bg-transparent px-2.5 py-1 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="draft">Taslak (Yayında Değil)</option>
              <option value="open">Açık (Başvuruya Açık)</option>
              <option value="closed">Kapalı (Başvuruya Kapalı)</option>
            </select>
          </div>
        </div>

        {/* Kapak Görseli */}
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

        {/* IBAN ve Ödeme Açıklaması */}
        <div className="space-y-2">
          <Label htmlFor="paymentInfo" className="text-neutral-700">
            Ödeme & IBAN Bilgisi
          </Label>
          <Textarea
            id="paymentInfo"
            value={paymentInfo}
            onChange={(e) => setPaymentInfo(e.target.value)}
            placeholder={"Banka: Ziraat Bankası\nIBAN: TR00 0000 0000 0000 0000 00\nAlıcı: Gazi Gezi Kulübü\nAçıklama: Ad Soyad - Gezi Adı"}
            rows={3}
          />
          <p className="text-xs text-neutral-400">
            Kayıt olan öğrencilere gösterilecek banka ve dekont talimatları.
          </p>
        </div>

        {/* Açıklama */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-neutral-700">
            Gezi Detayları ve Programı
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Gezinin program akışı, dahil olan ve olmayan hizmetler..."
            rows={5}
          />
        </div>

        {/* Butonlar */}
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
            {loading ? "Kaydediliyor..." : "Geziyi Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  );
}

