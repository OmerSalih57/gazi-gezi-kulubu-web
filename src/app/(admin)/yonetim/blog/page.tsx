import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { BlogRowActions } from "@/components/admin/BlogRowActions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BlogPost } from "@/types/database";

function formatDate(value: string | null) {
  if (!value) return "Taslak";
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminBlogPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  const posts = (data as BlogPost[] | null) ?? [];
  const missing = Boolean(error && error.message.toLowerCase().includes("blog_posts"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Blog ve Rehberler</h1>
          <p className="text-sm text-neutral-500">Gezi notları, duyurular ve rota rehberlerini yönetin.</p>
        </div>
        <Link href="/yonetim/blog/yeni">
          <Button className="bg-orange-600 text-white hover:bg-orange-700">+ Yeni Yazı</Button>
        </Link>
      </div>

      {missing && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Yazı tablosu henüz oluşturulmamış. Supabase SQL Editor’da{" "}
          <span className="font-mono">supabase/migrations/0002_blog_posts.sql</span> dosyasını çalıştırın.
        </p>
      )}

      {error && !missing && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error.message}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başlık</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-neutral-500">
                  Henüz yazı yok.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="font-semibold text-neutral-900">{post.title}</div>
                    <div className="text-[11px] text-neutral-400">/blog/{post.slug}</div>
                  </TableCell>
                  <TableCell className="text-sm">{post.category}</TableCell>
                  <TableCell className="text-sm text-neutral-600">{formatDate(post.published_at)}</TableCell>
                  <TableCell>
                    <BlogRowActions id={post.id} title={post.title} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
