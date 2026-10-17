import { z } from "zod";
import { slugify } from "@/lib/validations/event";

export const BLOG_CATEGORIES = ["Rehber", "Gezi Notu", "Duyuru", "Kültür"] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const blogPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Başlık en az 3 karakter olmalıdır")
    .max(160, "Başlık en fazla 160 karakter olabilir"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug en az 3 karakter olmalıdır")
    .max(160, "Slug en fazla 160 karakter olabilir")
    .regex(/^[a-z0-9-]+$/, "Slug yalnızca küçük harf, rakam ve tire (-) içerebilir"),
  content: z
    .string()
    .trim()
    .min(10, "İçerik en az 10 karakter olmalıdır"),
  cover_image: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^https?:\/\//.test(value), "Kapak görseli geçerli bir adres olmalıdır"),
  category: z.enum(BLOG_CATEGORIES),
  published: z.boolean(),
  published_at: z.string().optional(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

export function blogSlug(title: string, slug?: string) {
  return slugify(slug?.trim() || title);
}

export function resolvePublishedAt(input: { published: boolean; published_at?: string }) {
  if (!input.published) return null;
  if (input.published_at) {
    const date = new Date(input.published_at);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }
  return new Date().toISOString();
}
