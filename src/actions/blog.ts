"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { blogPostSchema, blogSlug, resolvePublishedAt, type BlogPostInput } from "@/lib/validations/blog";

const POST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SLUG_TAKEN = "Bu slug başka bir yazıda kullanılıyor. Farklı bir adres belirleyin.";

function revalidatePost(slug?: string | null, previousSlug?: string | null) {
  revalidatePath("/blog");
  revalidatePath("/yonetim/blog");
  revalidatePath("/");
  if (slug) revalidatePath(`/blog/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/blog/${previousSlug}`);
}

function missingTable(message: string) {
  return message.toLowerCase().includes("blog_posts");
}

export async function createBlogPost(input: BlogPostInput) {
  const me = await requireAdmin();
  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Geçersiz form verisi" };
  }

  const slug = blogSlug(parsed.data.title, parsed.data.slug);
  const supabase = await createClient();

  const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
  if (existing) return { ok: false as const, error: SLUG_TAKEN };

  const publishedAt = resolvePublishedAt(parsed.data);
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title: parsed.data.title,
      slug,
      content: parsed.data.content,
      cover_image: parsed.data.cover_image || null,
      category: parsed.data.category,
      author_id: me.user.id,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false as const, error: SLUG_TAKEN };
    if (missingTable(error.message)) {
      return {
        ok: false as const,
        error: "blog_posts tablosu henüz yok. supabase/migrations/0002_blog_posts.sql dosyasını SQL Editor'da çalıştırın.",
      };
    }
    return { ok: false as const, error: `Yazı kaydedilemedi: ${error.message}` };
  }

  revalidatePost(data.slug);
  return { ok: true as const, id: data.id as string };
}

export async function updateBlogPost(id: string, input: BlogPostInput) {
  await requireAdmin();
  if (!POST_ID.test(id)) return { ok: false as const, error: "Geçersiz yazı." };

  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Geçersiz form verisi" };
  }

  const slug = blogSlug(parsed.data.title, parsed.data.slug);
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("blog_posts")
    .select("id, slug, published_at")
    .eq("id", id)
    .maybeSingle();

  if (!current) return { ok: false as const, error: "Yazı bulunamadı." };

  const { data: clash } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();

  if (clash) return { ok: false as const, error: SLUG_TAKEN };

  const publishedAt = parsed.data.published
    ? resolvePublishedAt({
        published: true,
        published_at: parsed.data.published_at || current.published_at || undefined,
      })
    : null;

  const { error } = await supabase
    .from("blog_posts")
    .update({
      title: parsed.data.title,
      slug,
      content: parsed.data.content,
      cover_image: parsed.data.cover_image || null,
      category: parsed.data.category,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { ok: false as const, error: SLUG_TAKEN };
    return { ok: false as const, error: `Yazı güncellenemedi: ${error.message}` };
  }

  revalidatePost(slug, current.slug);
  return { ok: true as const };
}

export async function deleteBlogPost(id: string) {
  await requireAdmin();
  if (!POST_ID.test(id)) return { ok: false as const, error: "Geçersiz yazı." };

  const supabase = await createClient();
  const { data: current } = await supabase.from("blog_posts").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) return { ok: false as const, error: `Yazı silinemedi: ${error.message}` };

  revalidatePost(current?.slug);
  return { ok: true as const };
}
