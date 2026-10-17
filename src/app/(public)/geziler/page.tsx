import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { tripBadge, tripBadgeClass, remainingSeats } from "@/lib/events/availability";
import { loadBookedMap } from "@/lib/events/occupancy";
import type { EventItem } from "@/types/database";

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("tr-TR", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return dateStr;
  }
}

export default async function PublicEventsPage() {
  await connection();
  const supabase = await createClient();

  // Yalnızca başvuruya açık veya yayınlanmış gezileri getir
  const { data: rawEvents } = await supabase
    .from("events")
    .select("*")
    .in("status", ["open", "closed", "completed"])
    .order("starts_at", { ascending: true });

  const events = (rawEvents as EventItem[] | null) ?? [];
  const regCounts = await loadBookedMap(supabase);

  return (
    <div className="space-y-8">
      {/* Sayfa Başlığı */}
      <div className="space-y-2 border-b pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl dark:text-zinc-50">
          Kulüp Gezileri
        </h1>
        <p className="text-neutral-500 max-w-2xl text-base">
          Gazi Üniversitesi Gezi Kulübü ile yeni rotaları keşfedin, doğayla buluşun ve unutulmaz anılar biriktirin.
        </p>
      </div>

      {/* Gezi Kartları Listesi */}
      {events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
          <div className="mx-auto size-14 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-2xl">
            🏔️
          </div>
          <h3 className="text-lg font-bold text-neutral-900">Şu Anda Açık Gezi Bulunmuyor</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            Gelecek gezilerimiz planlanıyor. Yeni duyurularımızdan haberdar olmak için kulübümüzü takipte kalın!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const booked = regCounts[event.id] || 0;
            const remaining = remainingSeats(event.capacity, booked);
            const badge = tripBadge(event, booked);
            const isOpen = event.status === "open" && remaining > 0;

            return (
              <div
                key={event.id}
                className="group flex flex-col overflow-hidden rounded-[1.7rem] border border-white/80 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-24px_rgba(234,88,12,0.35)] dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                {/* Kapak Görseli */}
                <div className="relative h-52 w-full overflow-hidden bg-neutral-100">
                  {event.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.cover_url}
                      alt={event.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-tr from-orange-400 to-amber-500 flex items-center justify-center text-white text-4xl">
                      🏔️
                    </div>
                  )}

                  {/* Durum Rozeti */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shadow-xs ${tripBadgeClass(badge.tone)}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Kart İçeriği */}
                <div className="flex flex-1 flex-col p-5 space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-orange-600">
                      📅 {formatDate(event.starts_at)}
                    </p>
                    <h3 className="text-lg font-bold text-neutral-900 line-clamp-1 transition-colors group-hover:text-orange-600 dark:text-zinc-50">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Bilgi Şeridi */}
                  <div className="mt-auto pt-3 border-t flex items-center justify-between text-xs text-neutral-600">
                    <div>
                      <span className="text-[11px] text-neutral-400 block">Ücret</span>
                      <strong className="text-sm font-bold text-neutral-900 dark:text-zinc-100">
                        {event.price_try === 0
                          ? "Ücretsiz"
                          : `${Number(event.price_try).toLocaleString("tr-TR")} ₺`}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-neutral-400 block">Kalan Kontenjan</span>
                      <strong className={remaining > 0 ? "text-neutral-900" : "text-red-600 font-bold"}>
                        {remaining} / {event.capacity} Kişi
                      </strong>
                    </div>
                  </div>

                  <Link href={`/geziler/${event.slug}`} className="w-full">
                    <Button
                      variant={isOpen ? "default" : "outline"}
                      className={`w-full text-xs font-medium py-2 ${
                        isOpen
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "text-neutral-700"
                      }`}
                    >
                      {isOpen ? "İncele ve Başvur →" : "Detayları İncele"}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

