"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRegistration } from "@/actions/registrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RegistrationFormProps {
  eventId: string;
  eventSlug: string;
  initialFullName?: string;
  initialPhone?: string;
  initialTcNo?: string;
  initialStudentNo?: string;
}

export function RegistrationForm({
  eventId,
  eventSlug,
  initialFullName = "",
  initialPhone = "",
  initialTcNo = "",
  initialStudentNo = "",
}: RegistrationFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [tcNo, setTcNo] = useState(initialTcNo);
  const [studentNo, setStudentNo] = useState(initialStudentNo);
  const [kvkkConsent, setKvkkConsent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!kvkkConsent) {
      setError("Başvuru yapabilmek için KVKK onayını vermelisiniz.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createRegistration({
      eventId,
      eventSlug,
      fullName,
      phone,
      tcNo,
      studentNo: studentNo || undefined,
      kvkkConsent,
    });

    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }

    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs"
    >
      <div>
        <h3 className="text-lg font-bold text-neutral-900">Geziye Başvur</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          Seyahat sigortası ve yolcu listesi için bilgilerinizi eksiksiz doldurunuz.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="reg-fullName" className="text-neutral-700 text-xs font-semibold">
            Ad Soyad *
          </Label>
          <Input
            id="reg-fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Adınız Soyadınız"
            required
            minLength={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-phone" className="text-neutral-700 text-xs font-semibold">
            Telefon Numarası *
          </Label>
          <Input
            id="reg-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05xx xxx xx xx"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-tcNo" className="text-neutral-700 text-xs font-semibold">
            T.C. Kimlik Numarası *
          </Label>
          <Input
            id="reg-tcNo"
            type="text"
            maxLength={11}
            value={tcNo}
            onChange={(e) => setTcNo(e.target.value.replace(/\D/g, ""))}
            placeholder="11 haneli kimlik numaranız"
            required
          />
          <p className="text-[11px] text-neutral-400">
            T.C. Ulaştırma Bakanlığı yolcu bildirimi ve seyahat sigortası için zorunludur.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reg-studentNo" className="text-neutral-700 text-xs font-semibold">
            Öğrenci Numarası (Varsa)
          </Label>
          <Input
            id="reg-studentNo"
            value={studentNo}
            onChange={(e) => setStudentNo(e.target.value)}
            placeholder="Örn: 210000000"
          />
        </div>

        <div className="pt-2">
          <label className="flex items-start gap-2.5 text-xs text-neutral-600 cursor-pointer">
            <input
              type="checkbox"
              checked={kvkkConsent}
              onChange={(e) => setKvkkConsent(e.target.checked)}
              className="mt-0.5 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
              required
            />
            <span>
              Kişisel verilerimin, etkinlik organizasyonu ve seyahat sigortası kapsamında işlenmesine ilişkin{" "}
              <strong className="text-neutral-800">KVKK Aydınlatma Metni</strong>&apos;ni okudum ve onaylıyorum.
            </span>
          </label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 text-sm"
      >
        {loading ? "Başvuru Yapılıyor..." : "Başvuruyu Tamamla"}
      </Button>
    </form>
  );
}

