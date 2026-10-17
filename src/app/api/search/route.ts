import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function pattern(raw: string) {
  const cleaned = raw.replace(/[%_]/g, "").trim().slice(0, 60);
  return cleaned.length < 2 ? "" : `%${cleaned}%`;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const like = pattern(query);
  if (!like) {
    return NextResponse.json({ trips: [], posts: [], albums: [] });
  }

  const supabase = await createClient();
  const [trips, posts, albums] = await Promise.all([
    supabase
      .from("events")
      .select("title, slug")
      .in("status", ["open", "closed", "completed"])
      .ilike("title", like)
      .limit(6),
    supabase
      .from("blog_posts")
      .select("title, slug, category")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .ilike("title", like)
      .limit(6),
    supabase.from("albums").select("id, title").ilike("title", like).limit(6),
  ]);

  return NextResponse.json({
    trips: trips.error ? [] : (trips.data ?? []),
    posts: posts.error ? [] : (posts.data ?? []),
    albums: albums.error ? [] : (albums.data ?? []),
  });
}
