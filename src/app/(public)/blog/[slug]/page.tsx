import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PostBody } from "@/components/blog/PostBody";
import type { BlogPost } from "@/types/database";
import { loadPublicProfiles } from "@/lib/profiles-public";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) notFound();
  const post = data as BlogPost;

  let authorName = "Gazi Gezi Kulübü";
  if (post.author_id) {
    const [author] = await loadPublicProfiles(supabase, [post.author_id]);
    if (author?.full_name) authorName = author.full_name;
  }

  const published = post.published_at
    ? new Date(post.published_at).toLocaleDateString("tr-TR", { dateStyle: "long" })
    : "";

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <Link href="/blog" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Tüm rehberler
      </Link>

      <header className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">{post.category}</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-950 sm:text-5xl">{post.title}</h1>
        <p className="text-sm text-neutral-500">
          {authorName}
          {published ? ` · ${published}` : ""}
        </p>
      </header>

      {post.cover_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image}
          alt=""
          className="max-h-[420px] w-full rounded-3xl object-cover shadow-sm"
        />
      ) : (
        <div className="h-48 rounded-3xl bg-linear-to-br from-orange-500 via-amber-400 to-sky-700" />
      )}

      <PostBody content={post.content} />
    </article>
  );
}
