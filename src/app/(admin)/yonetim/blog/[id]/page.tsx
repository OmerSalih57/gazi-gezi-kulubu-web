import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { BlogPostForm, type BlogFormValues } from "@/components/admin/BlogPostForm";
import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/validations/blog";
import type { BlogPost } from "@/types/database";

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();

  const post = data as BlogPost;
  const category = BLOG_CATEGORIES.includes(post.category as BlogCategory)
    ? (post.category as BlogCategory)
    : "Rehber";

  const initial: BlogFormValues = {
    title: post.title,
    slug: post.slug,
    content: post.content,
    cover_image: post.cover_image ?? "",
    category,
    published: Boolean(post.published_at),
    published_at: toDatetimeLocal(post.published_at),
  };

  return <BlogPostForm postId={post.id} initial={initial} />;
}
