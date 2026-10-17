import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { InstagramShowcase } from "@/components/home/InstagramShowcase";
import { FeaturedTrips, type FeaturedTrip } from "@/components/home/FeaturedTrips";
import { QuizTeaser } from "@/components/home/QuizTeaser";
import { loadQuizBoards } from "@/lib/quiz-board";
import { homeFaq } from "@/data/faq";
import { StatCounters } from "@/components/home/StatCounters";
import { remainingSeats, tripBadge } from "@/lib/events/availability";
import { loadBookedMap } from "@/lib/events/occupancy";
import { loadPublicProfileCount } from "@/lib/profiles-public";
import type { EventItem } from "@/types/database";

function formatDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export async function HomeFeed() {
  await connection();
  const supabase = await createClient();

  const [{ count: tripCount }, memberCount, locations, eventsResult, booked, guidesResult, quizBoards] =
    await Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }).in("status", ["open", "closed", "completed"]),
      loadPublicProfileCount(supabase),
      supabase.from("map_locations").select("*", { count: "exact", head: true }),
      supabase
        .from("events")
        .select("*")
        .in("status", ["open", "closed", "completed"])
        .order("starts_at", { ascending: true })
        .limit(8),
      loadBookedMap(supabase),
      supabase
        .from("blog_posts")
        .select("title, slug, category")
        .not("published_at", "is", null)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(3),
      loadQuizBoards(supabase),
    ]);

  const events = ((eventsResult.data as EventItem[] | null) ?? []).slice().sort((a, b) => {
    if (a.status === "open" && b.status !== "open") return -1;
    if (b.status === "open" && a.status !== "open") return 1;
    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  });

  const featured: FeaturedTrip[] = events.slice(0, 6).map((event) => {
    const badge = tripBadge(event, booked[event.id] || 0);
    const remaining = remainingSeats(event.capacity, booked[event.id] || 0);
    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      startsAt: formatDate(event.starts_at),
      priceLabel: event.price_try === 0 ? "Ücretsiz" : `${Number(event.price_try).toLocaleString("tr-TR")} ₺`,
      remainingLabel: `${remaining} kontenjan`,
      coverUrl: event.cover_url,
      badge: badge.label,
      tone: badge.tone,
    };
  });

  const destinationCount = locations.error ? (tripCount ?? 0) : (locations.count ?? 0);
  const guides = (guidesResult.data as { title: string; slug: string; category: string }[] | null) ?? [];

  return (
    <>
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[-10%] size-[420px] rounded-full bg-orange-500/40 blur-3xl" />
          <div className="absolute bottom-0 left-[-10%] size-[360px] rounded-full bg-sky-500/30 blur-3xl" />
          <svg className="absolute inset-x-0 bottom-0 h-40 w-full text-neutral-950" viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden>
            <path fill="currentColor" d="M0 120 L180 70 L340 130 L520 40 L760 120 L980 30 L1200 110 L1440 50 L1440 180 L0 180 Z" opacity="0.55" />
            <path fill="currentColor" d="M0 150 L220 100 L460 160 L700 90 L980 150 L1440 80 L1440 180 L0 180 Z" />
          </svg>
        </div>
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-4 py-24">
          <span className="mb-5 inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-orange-100 shadow-lg backdrop-blur-md">
            Gazi Üniversitesi öğrenci topluluğu
          </span>
          <h1 className="max-w-3xl text-5xl font-black tracking-[-0.04em] sm:text-7xl">
            Rotayı birlikte çizin,{" "}
            <span className="bg-linear-to-r from-orange-300 via-amber-200 to-orange-400 bg-clip-text text-transparent">
              yola birlikte çıkın.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Kapadokya’dan Ege’ye, kulübün açık gezilerine katılın. Kontenjanı, dekontu ve biletinizi tek yerden takip edin.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/geziler">
              <Button size="lg" className="rounded-full bg-orange-500 px-8 text-white shadow-[0_16px_40px_-18px_rgba(249,115,22,0.9)] transition hover:-translate-y-0.5 hover:bg-orange-400">
                Açık geziler
              </Button>
            </Link>
            <Link href="/blog">
              <Button size="lg" variant="outline" className="rounded-full border-white/30 bg-white/10 px-6 text-white backdrop-blur hover:bg-white/20">
                Gezi rehberleri
              </Button>
            </Link>
          </div>
          <div className="mt-10 max-w-xl rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
            <StatCounters trips={tripCount ?? 0} members={memberCount ?? 0} destinations={destinationCount} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-14">
        <FeaturedTrips trips={featured} />

        <QuizTeaser players={quizBoards.month.slice(0, 3)} ready={quizBoards.ready} />

        <Suspense
          fallback={
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="min-h-72 animate-pulse rounded-[1.75rem] bg-neutral-200" />
              ))}
            </div>
          }
        >
          <InstagramShowcase />
        </Suspense>

        <section className="grid gap-6 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur-md sm:grid-cols-[1.2fr_1fr] sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Rehberler</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-zinc-50">Yola çıkmadan önce okuyun</h2>
            <p className="text-sm leading-relaxed text-neutral-500">
              Şehir notları, gezi duyuruları ve kulüp yazıları blogda. Yeni bir rota eklemek için yönetim panelindeki Blog bölümünü kullanın.
            </p>
            <Link href="/blog" className="inline-flex text-sm font-semibold text-orange-700 hover:underline">
              Tüm yazılar →
            </Link>
          </div>
          <ul className="space-y-3">
            {guides.length === 0 ? (
              <li className="rounded-2xl bg-neutral-50 px-4 py-5 text-sm text-neutral-500 dark:bg-zinc-950/70 dark:text-zinc-400">
                İlk rehber yayınlandığında burada görünecek.
              </li>
            ) : (
              guides.map((guide) => (
                <li key={guide.slug}>
                  <Link href={`/blog/${guide.slug}`} className="block rounded-2xl bg-neutral-50 px-4 py-3 hover:bg-orange-50 dark:bg-zinc-950/70 dark:hover:bg-zinc-800">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">{guide.category}</span>
                    <span className="mt-1 block font-semibold text-neutral-900 dark:text-zinc-100">{guide.title}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        <FaqAccordion
          items={homeFaq}
          title="Geziye çıkmadan önce"
          intro="Başvuru, ödeme ve iptal için kulübün uyguladığı kurallar."
        />
      </div>
    </>
  );
}
