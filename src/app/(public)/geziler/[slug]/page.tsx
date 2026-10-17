import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { TripStory } from "@/components/events/TripStory";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { fallbackHighlights, fallbackItinerary, readHighlights, readItinerary } from "@/lib/events/story";
import { RegistrationForm } from "@/components/booking/RegistrationForm";
import { tripFaq } from "@/data/faq";
import { loadBookedMap } from "@/lib/events/occupancy";
import { loadPublicProfiles } from "@/lib/profiles-public";
import { TripReviews, type PublicReview } from "@/components/events/TripReviews";
import { ReceiptUploadForm } from "@/components/booking/ReceiptUploadForm";
import type { EventItem, RegistrationItem } from "@/types/database";

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("tr-TR", {
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return dateStr;
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const supabase = await createClient();

  // Geziyi slug ile çek
  const { data: rawEvent } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!rawEvent) {
    notFound();
  }

  const event = rawEvent as EventItem;
  const storedStops = readItinerary(event.itinerary);
  const storedHighlights = readHighlights(event.highlights);
  const stops = storedStops.length > 0 ? storedStops : fallbackItinerary(event);
  const highlights = storedHighlights.length > 0 ? storedHighlights : fallbackHighlights(event);

  const booked = await loadBookedMap(supabase);
  const remaining = Math.max(0, event.capacity - (booked[event.id] ?? 0));
  const isDeadlinePassed = event.registration_deadline
    ? new Date(event.registration_deadline) < new Date()
    : false;
  const canRegister = event.status === "open" && remaining > 0 && !isDeadlinePassed;

  // Mevcut kullanıcı oturumu
  const me = await getCurrentProfile();

  // Kullanıcının bu geziye ait mevcut başvurusu var mı?
  let existingReg: RegistrationItem | null = null;
  if (me) {
    const { data: reg } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", event.id)
      .eq("user_id", me.user.id)
      .neq("status", "cancelled")
      .maybeSingle();

    existingReg = reg as RegistrationItem | null;
  }

  const { data: reviewRows, error: reviewError } = await supabase
    .from("trip_reviews")
    .select("id, user_id, rating, comment, created_at")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  const reviewIds = [...new Set((reviewRows ?? []).map((row) => row.user_id as string))];
  const people = await loadPublicProfiles(supabase, reviewIds);
  const names = new Map(people.map((person) => [person.id, person.full_name || "Üye"]));
  const reviews: PublicReview[] = ((reviewRows as { id: string; user_id: string; rating: number; comment: string; created_at: string }[] | null) ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: names.get(row.user_id) || "Üye",
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at).toLocaleDateString("tr-TR"),
  }));

  let contact = { phone: "", tcNo: "", studentNo: "" };
  if (me) {
    const { data: details } = await supabase
      .from("profile_details")
      .select("phone, tc_no, student_no")
      .eq("user_id", me.user.id)
      .maybeSingle();
    contact = {
      phone: details?.phone || "",
      tcNo: details?.tc_no || "",
      studentNo: details?.student_no || "",
    };
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Geri Dönüş Linki */}
      <div>
        <Link
          href="/geziler"
          className="inline-flex items-center text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          ← Tüm Gezilere Dön
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Sol Kolon: Gezi Detayları ve Açıklaması */}
        <div className="lg:col-span-2 space-y-6">
          {/* Kapak Görseli */}
          <div className="relative h-64 w-full overflow-hidden rounded-[2rem] border border-white/70 bg-neutral-100 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.55)] sm:h-96">
            {event.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.cover_url}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-linear-to-tr from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center text-white text-6xl">
                🏔️
              </div>
            )}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center rounded-full border border-white/25 bg-neutral-950/50 px-3 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md">
                {event.price_try === 0
                  ? "Ücretsiz"
                  : `${Number(event.price_try).toLocaleString("tr-TR")} ₺`}
              </span>
            </div>
          </div>

          {/* Başlık ve Temel Bilgiler */}
          <div className="space-y-4 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.4)] backdrop-blur-md sm:p-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
                {event.title}
              </h1>
              <p className="text-sm font-medium text-orange-600 mt-1">
                📅 {formatDate(event.starts_at)}
              </p>
            </div>

            {/* Bilgi Rozetleri */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/60">
                <span className="text-[11px] text-neutral-400 block font-medium">Kontenjan</span>
                <span className="text-sm font-bold text-neutral-800">
                  {remaining} / {event.capacity} Boş
                </span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/60">
                <span className="text-[11px] text-neutral-400 block font-medium">Katılım Ücreti</span>
                <span className="text-sm font-bold text-neutral-800">
                  {event.price_try === 0 ? "Ücretsiz" : `${Number(event.price_try).toLocaleString("tr-TR")} ₺`}
                </span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-2xl border border-neutral-200/60 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-neutral-400 block font-medium">Son Başvuru</span>
                <span className="text-xs font-bold text-neutral-800">
                  {event.registration_deadline
                    ? new Date(event.registration_deadline).toLocaleDateString("tr-TR")
                    : "Dolana Kadar"}
                </span>
              </div>
            </div>

            {/* Gezi Programı ve Açıklama */}
            <div className="pt-4 border-t space-y-3">
              <h2 className="text-base font-bold text-neutral-900">Gezi Detayları ve Program</h2>
              <div className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed font-sans">
                {event.description || "Bu gezi için henüz detaylı açıklama eklenmedi."}
              </div>
            </div>
          </div>
          <TripStory stops={stops} highlights={highlights} usingSchedule={storedStops.length === 0} />
          <FaqAccordion
            items={tripFaq}
            title="Bu gezi için kurallar"
            intro="Ödeme, iptal ve yoklama adımları."
          />
          <TripReviews
            eventId={event.id}
            slug={event.slug}
            reviews={reviews}
            canReview={Boolean(me && event.status === "completed" && existingReg?.status === "approved")}
            signedIn={Boolean(me)}
            completed={event.status === "completed"}
            unavailable={Boolean(reviewError)}
            viewerId={me?.user.id ?? null}
          />
        </div>

        {/* Sağ Kolon: Başvuru veya Mevcut Başvuru Durumu */}
        <div className="space-y-6 lg:sticky lg:top-20">
          {existingReg ? (
            /* Kullanıcının zaten bir başvurusu var */
            existingReg.status === "approved" ? (
              <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-xs space-y-4 text-center">
                <div className="size-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Tebrikler, Kaydınız Onaylandı!</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Ödemeniz doğrulandı. Etkinlik günü biletinizi kontrol noktasında okutabilirsiniz.
                  </p>
                </div>
                <Link href={`/biletlerim/${existingReg.id}`} className="block">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 text-xs">
                    QR Biletimi Görüntüle →
                  </Button>
                </Link>
              </div>
            ) : (
              /* Dekont yükleme veya durum takip formu */
              <ReceiptUploadForm
                registrationId={existingReg.id}
                eventSlug={event.slug}
                paymentInfo={event.payment_info}
                priceTry={event.price_try}
                status={existingReg.status}
                adminNote={existingReg.admin_note}
              />
            )
          ) : !me ? (
            /* Giriş yapmamış kullanıcı */
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs space-y-4 text-center">
              <div className="size-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto text-xl">
                🔒
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">Başvuru İçin Giriş Yapın</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Gazi Gezi Kulübü gezilerine başvurabilmek için üye girişi yapmanız gerekmektedir.
                </p>
              </div>
              <Link href={`/giris?next=/geziler/${event.slug}`} className="block">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 text-xs">
                  Giriş Yap veya Kayıt Ol
                </Button>
              </Link>
            </div>
          ) : canRegister ? (
            /* Başvuru Formu */
            <RegistrationForm
              eventId={event.id}
              eventSlug={event.slug}
              initialFullName={me.profile?.full_name || me.user.email || ""}
              initialPhone={contact.phone}
              initialTcNo={contact.tcNo}
              initialStudentNo={contact.studentNo}
            />
          ) : (
            /* Başvurular kapalı */
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs text-center space-y-3">
              <div className="size-12 bg-neutral-100 text-neutral-500 rounded-full flex items-center justify-center mx-auto text-xl">
                ⏳
              </div>
              <h3 className="text-base font-bold text-neutral-900">Başvurular Kapandı</h3>
              <p className="text-xs text-neutral-500">
                {remaining === 0
                  ? "Kontenjan dolduğu için kayıtlar kapanmıştır."
                  : "Bu gezi için başvuru süresi sona ermiştir."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

