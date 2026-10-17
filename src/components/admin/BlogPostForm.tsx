"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBlogPost, updateBlogPost } from "@/actions/blog";
import { BLOG_CATEGORIES, blogSlug, type BlogCategory, type BlogPostInput } from "@/lib/validations/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type BlogFormValues = {
  title: string;
  slug: string;
  content: string;
  cover_image: string;
  category: BlogCategory;
  published: boolean;
  published_at: string;
};

export function BlogPostForm({
  postId,
  initial,
}: {
  postId?: string;
  initial?: BlogFormValues;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(postId));
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverImage, setCoverImage] = useState(initial?.cover_image ?? "");
  const [category, setCategory] = useState<BlogCategory>(initial?.category ?? "Rehber");
  const [published, setPublished] = useState(initial?.published ?? false);
  const [publishedAt, setPublishedAt] = useState(initial?.published_at ?? "");

  const handleTitle = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(blogSlug(value));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const input: BlogPostInput = {
      title,
      slug: slug || blogSlug(title),
      content,
      cover_image: coverImage || undefined,
      category,
      published,
      published_at: publishedAt || undefined,
    };

    const result = postId ? await updateBlogPost(postId, input) : await createBlogPost(input);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/yonetim/blog");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <Link href="/yonetim/blog" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Yazı listesine dön
      </Link>
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          {postId ? "Yazıyı Düzenle" : "Yeni Rehber Yazısı"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Paragrafları boş satırla ayırın. Başlık için satırı ## ile, madde için - ile başlatın.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="blog-title">Başlık *</Label>
          <Input id="blog-title" value={title} onChange={(event) => handleTitle(event.target.value)} required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="blog-slug">URL slug *</Label>
          <Input
            id="blog-slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            required
          />
          <p className="text-[11px] text-neutral-400">Adres: /blog/{slug || "yazi-adresi"}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="blog-category">Kategori *</Label>
          <select
            id="blog-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as BlogCategory)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {BLOG_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="blog-cover">Kapak görseli</Label>
          <Input
            id="blog-cover"
            value={coverImage}
            onChange={(event) => setCoverImage(event.target.value)}
            placeholder="https://"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="blog-content">İçerik *</Label>
          <Textarea
            id="blog-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={14}
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
          Yayında
        </label>
        {published && (
          <div className="space-y-1.5">
            <Label htmlFor="blog-published-at">Yayın tarihi</Label>
            <Input
              id="blog-published-at"
              type="datetime-local"
              value={publishedAt}
              onChange={(event) => setPublishedAt(event.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/yonetim/blog">
          <Button type="button" variant="outline">
            İptal
          </Button>
        </Link>
        <Button type="submit" disabled={loading} className="bg-orange-600 text-white hover:bg-orange-700">
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}
