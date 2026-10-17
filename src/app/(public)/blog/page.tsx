import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BLOG_CATEGORIES } from "@/lib/validations/blog";
import type { BlogPost } from "@/types/database";

function excerpt(content: string) {
  const plain = content.replace(/^#+\s+/gm, "").replace(/\s+/g, " ").trim();
  return plain.length > 160 ? `${plain.slice(0, 160).trim()}…` : plain;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", { dateStyle: "long" });
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  await connection();
  const { kategori } = await searchParams;
  const active = BLOG_CATEGORIES.includes(kategori as (typeof BLOG_CATEGORIES)[number]) ? kategori : "";

  const supabase = await createClient();
  let query = supabase
    .from("blog_posts")
    .select("id, title, slug, content, cover_image, category, published_at")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (active) query = query.eq("category", active);

  const { data, error } = await query;
  const posts = (data as Pick<BlogPost, "id" | "title" | "slug" | "content" | "cover_image" | "category" | "published_at">[] | null) ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">Kulüp arşivi</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl dark:text-zinc-50">Blog ve Gezi Rehberleri</h1>
        <p className="max-w-2xl text-neutral-500">
          Rota notları, şehir rehberleri ve kulüp duyuruları. Bir sonraki geziye çıkmadan önce okuyun.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/blog"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-neutral-100 text-neutral-600" : "bg-neutral-900 text-white"}`}
        >
          Tümü
        </Link>
        {BLOG_CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/blog?kategori=${encodeURIComponent(category)}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              active === category ? "bg-orange-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {category}
          </Link>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          Rehberler şu anda yüklenemiyor. Kısa süre sonra yeniden deneyin.
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
          <h2 className="text-lg font-bold text-neutral-900">Bu filtrede yazı yok</h2>
          <p className="mt-2 text-sm text-neutral-500">Yeni rehberler yayınlandığında burada görünecek.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
            >
              <div className="relative h-44 bg-neutral-100">
                {post.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.cover_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-end bg-linear-to-br from-orange-500 via-amber-500 to-sky-700 p-4 text-white">
                    <span className="text-sm font-semibold tracking-wide">{post.category}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col space-y-2 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">
                  {post.category}
                  {post.published_at ? ` · ${formatDate(post.published_at)}` : ""}
                </p>
                <h2 className="text-lg font-bold text-neutral-900 group-hover:text-orange-600 dark:text-zinc-50">{post.title}</h2>
                <p className="line-clamp-3 text-sm leading-relaxed text-neutral-500">{excerpt(post.content)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
