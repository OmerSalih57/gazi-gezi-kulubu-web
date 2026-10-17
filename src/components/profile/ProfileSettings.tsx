"use client";

import { useState } from "react";
import Link from "next/link";
import { changePassword, updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ProfileTrip = {
  id: string;
  status: string;
  title: string;
  slug: string;
  startsAt: string;
  ticket: boolean;
};

const STATUS: Record<string, string> = {
  pending_payment: "Ödeme bekliyor",
  receipt_uploaded: "Dekont yüklendi",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  cancelled: "İptal",
};

export function ProfileSettings({
  fullName,
  phone,
  tcNo,
  studentNo,
  avatarUrl,
  trips,
  detailsReady,
}: {
  fullName: string;
  phone: string;
  tcNo: string;
  studentNo: string;
  avatarUrl: string | null;
  trips: ProfileTrip[];
  detailsReady: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState(avatarUrl);

  const save = async (formData: FormData) => {
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await updateProfile(formData);
    setPending(false);
    if (!result.ok) setError(result.error);
    else setMessage("Profilin kaydedildi.");
  };

  const savePassword = async (formData: FormData) => {
    setPending(true);
    setPasswordError(null);
    setPasswordMessage(null);
    const result = await changePassword(formData);
    setPending(false);
    if (!result.ok) setPasswordError(result.error);
    else setPasswordMessage("Şifren güncellendi.");
  };

  const tickets = trips.filter((trip) => trip.ticket);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] sm:p-8">
        <h1 className="text-3xl font-black tracking-tight text-neutral-950">Profilin</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Adın üst menüde görünür. Telefon, T.C. kimlik numarası ve öğrenci numaran yalnızca sana açıktır.
        </p>
        {!detailsReady && (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Ayrıntı tablosu henüz yok. supabase/migrations/0006_profile_team_reviews.sql dosyasını çalıştırın.
          </p>
        )}
        <form action={save} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-center gap-4">
            {preview ? (
              <img src={preview} alt="" className="size-16 rounded-full object-cover" />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-full bg-orange-500 text-lg font-black text-white">
                {fullName.slice(0, 1).toLocaleUpperCase("tr-TR")}
              </span>
            )}
            <div className="space-y-1">
              <Label htmlFor="avatar">Profil fotoğrafı</Label>
              <Input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setPreview(URL.createObjectURL(file));
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="fullName">Ad soyad</Label>
            <Input id="fullName" name="fullName" defaultValue={fullName} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" defaultValue={phone} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tcNo">T.C. kimlik no</Label>
            <Input id="tcNo" name="tcNo" defaultValue={tcNo} inputMode="numeric" maxLength={11} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="studentNo">Öğrenci numarası</Label>
            <Input id="studentNo" name="studentNo" defaultValue={studentNo} />
          </div>
          {error && <p className="sm:col-span-2 text-sm text-rose-700">{error}</p>}
          {message && <p className="sm:col-span-2 text-sm text-emerald-700">{message}</p>}
          <div>
            <Button type="submit" disabled={pending || !detailsReady} className="bg-orange-600 text-white hover:bg-orange-700">
              Bilgileri kaydet
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] sm:p-8">
        <h2 className="text-xl font-extrabold tracking-tight text-neutral-950">Şifre değiştir</h2>
        <form action={savePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="password">Yeni şifre</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm">Yeni şifre tekrar</Label>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
          </div>
          {passwordError && <p className="sm:col-span-2 text-sm text-rose-700">{passwordError}</p>}
          {passwordMessage && <p className="sm:col-span-2 text-sm text-emerald-700">{passwordMessage}</p>}
          <div>
            <Button type="submit" disabled={pending} variant="outline">
              Şifreyi güncelle
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] sm:p-8">
        <h2 className="text-xl font-extrabold tracking-tight text-neutral-950">Aktif biletler</h2>
        {tickets.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Onaylı biletin yok.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {tickets.map((trip) => (
              <li key={trip.id} className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
                <span>
                  <span className="block text-sm font-bold text-neutral-900">{trip.title}</span>
                  <span className="text-xs text-neutral-500">{trip.startsAt}</span>
                </span>
                <Link href={`/biletlerim/${trip.id}`} className="text-sm font-semibold text-orange-700 hover:underline">
                  QR bilet
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)] sm:p-8">
        <h2 className="text-xl font-extrabold tracking-tight text-neutral-950">Gezi geçmişin</h2>
        {trips.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Henüz bir gezi kaydın yok.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Link href={`/geziler/${trip.slug}`} className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-4 py-3 hover:bg-orange-50">
                  <span>
                    <span className="block text-sm font-bold text-neutral-900">{trip.title}</span>
                    <span className="text-xs text-neutral-500">{trip.startsAt}</span>
                  </span>
                  <span className="text-xs font-semibold text-neutral-600">{STATUS[trip.status] || trip.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
