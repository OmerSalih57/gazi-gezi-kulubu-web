import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/data/instagram";
import { InstagramMediaBoard } from "@/components/home/InstagramMediaBoard";
import { loadRecentInstagramPosts } from "@/lib/instagram-feed";

export async function InstagramShowcase() {
  const posts = await loadRecentInstagramPosts();

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-orange-600 uppercase">Instagram’da Biz</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-zinc-50">@{INSTAGRAM_HANDLE}</h2>
        </div>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center rounded-full border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-amber-300 hover:text-orange-600 hover:shadow-[0_0_18px_rgba(251,191,36,0.35)] dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100"
        >
          @{INSTAGRAM_HANDLE}
        </a>
      </div>
      <InstagramMediaBoard live={posts} />
    </section>
  );
}
