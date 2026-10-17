import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BoardGrid } from "@/components/about/BoardGrid";
import { StatCounters } from "@/components/home/StatCounters";
import { board } from "@/data/board";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/data/instagram";
import { loadPublicProfileCount } from "@/lib/profiles-public";

export default async function AboutPage() {
  await connection();
  const supabase = await createClient();
  const [{ count: tripCount }, memberCount, locations] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }).in("status", ["open", "closed", "completed"]),
    loadPublicProfileCount(supabase),
    supabase.from("map_locations").select("*", { count: "exact", head: true }),
  ]);
  const destinations = locations.error ? (tripCount ?? 0) : (locations.count ?? 0);

  return (
    <div className="space-y-14">
      <section className="overflow-hidden rounded-[2rem] bg-neutral-950 px-6 py-12 text-white sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">Gazi Gezi Kulübü</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
          Kampüsten yola çıkan, birlikte dönen bir topluluk.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
          Öğrencilerin yeni rotalar görmesi, aynı otobüste tanışması ve geziyi güvenli şekilde tamamlaması için kurulduk.
          Kayıt, ödeme ve yoklama bu sitede; hikâye ise yolda yazılıyor.
        </p>
        <div className="mt-8">
          <StatCounters trips={tripCount ?? 0} members={memberCount ?? 0} destinations={destinations} />
        </div>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300 hover:shadow-[0_0_22px_rgba(251,191,36,0.45)]"
        >
          Instagram’da @{INSTAGRAM_HANDLE}
        </a>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-neutral-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/80">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Misyon</p>
          <h2 className="mt-2 text-2xl font-extrabold text-neutral-900 dark:text-zinc-50">Ulaşılır geziler düzenlemek</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Kontenjanı, ücreti ve programı baştan ilan ederiz. Başvuruyu, dekontu ve bileti aynı yerde toplarız ki
            gezi günü kapıda liste aranmasın.
          </p>
        </article>
        <article className="rounded-3xl border border-neutral-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/80">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Vizyon</p>
          <h2 className="mt-2 text-2xl font-extrabold text-neutral-900 dark:text-zinc-50">Her dönem yeni bir rota</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Türkiye’nin şehirlerini, müzelerini ve patikalarını öğrenci bütçesiyle gezilebilir kılmak. Dönüşte de
            fotoğrafı, rehberi ve yoklama kaydını kulüp arşivinde bırakmak.
          </p>
        </article>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-600">Yönetim kurulu</p>
          <h2 className="mt-1 text-2xl font-extrabold text-neutral-900 dark:text-zinc-50">Görevi gör, bağlantıya geç</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500">
            Karttaki göreve tıklayınca sorumluluk açılır. Instagram bağlantısı kulübün @gazi.gezi hesabına gider.
          </p>
        </div>
        <BoardGrid members={board} />
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-neutral-950 px-6 py-10 text-white shadow-[0_30px_80px_-42px_rgba(15,23,42,0.8)] sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.28),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.18),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 backdrop-blur-xl" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-amber-300 uppercase">Ekibimize katılın</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Kulüp Ekibimize Katılın & Temsilci Olun</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Gazi Gezi Kulübü ailesinde aktif rol almak, etkinlik organizasyonlarında görev edinmek veya kendi sınıfının/bölümünün temsilcisi olmak ister misin? Ekibimize katılarak rotaları birlikte çizelim!
          </p>
          <Link
            href="/basvuru"
            className="mt-8 inline-flex rounded-full bg-amber-400 px-5 py-3 text-sm font-bold text-neutral-950 transition duration-300 hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-[0_0_28px_rgba(251,191,36,0.55)]"
          >
            Ekip & Temsilcilik Başvurusu Yap
          </Link>
        </div>
      </section>
    </div>
  );
}
