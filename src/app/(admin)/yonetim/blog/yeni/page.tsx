import { requireAdmin } from "@/lib/auth/guards";
import { BlogPostForm } from "@/components/admin/BlogPostForm";

export default async function NewBlogPostPage() {
  await requireAdmin();
  return <BlogPostForm />;
}
