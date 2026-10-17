import { unstable_cache } from "next/cache";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/data/instagram";

export type InstagramPost = {
  id: string;
  href: string;
  imageUrl: string;
  videoUrl: string | null;
  caption: string;
  kind: "Reel" | "Gönderi" | "Video";
  takenAt: string;
};

const FIVE_HOURS = 60 * 60 * 5;

let lastSuccess: { at: number; posts: InstagramPost[] } | null = null;

function shorten(text: string, fallback: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > 90 ? `${clean.slice(0, 87)}…` : clean;
}

function byNewest(posts: InstagramPost[]) {
  return [...posts].sort((a, b) => b.takenAt.localeCompare(a.takenAt)).slice(0, 3);
}

function isRemoteVideoStream(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const path = parsed.pathname.toLowerCase();
  if (/\.(jpe?g|png|webp|gif|avif)$/.test(path)) return false;
  if (path.endsWith(".mp4")) return true;
  const host = parsed.hostname.toLowerCase();
  return ["cdninstagram.com", "fbcdn.net", "fbsbx.com"].some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function remoteVideoUrl(isVideo: boolean, mediaUrl: string) {
  if (!isVideo || !isRemoteVideoStream(mediaUrl)) return null;
  return mediaUrl;
}

function fromGraph(items: unknown[]): InstagramPost[] {
  const posts: InstagramPost[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id : "";
    const permalink = typeof item.permalink === "string" ? item.permalink : INSTAGRAM_URL;
    const product = typeof item.media_product_type === "string" ? item.media_product_type.toUpperCase() : "";
    const mediaType = typeof item.media_type === "string" ? item.media_type.toUpperCase() : "";
    const video = mediaType === "VIDEO" || mediaType === "REELS" || product === "REELS" || product === "CLIPS";
    const mediaUrl = typeof item.media_url === "string" ? item.media_url : "";
    const thumb = typeof item.thumbnail_url === "string" ? item.thumbnail_url : "";
    const imageUrl = thumb || (!video ? mediaUrl : "");
    const videoUrl = remoteVideoUrl(video, mediaUrl);
    if (!id || (!imageUrl && !videoUrl)) continue;
    const kind = product === "REELS" || mediaType === "VIDEO" ? (product === "REELS" ? "Reel" : "Video") : "Gönderi";
    posts.push({
      id,
      href: permalink,
      imageUrl,
      videoUrl,
      caption: shorten(typeof item.caption === "string" ? item.caption : "", video ? "Kulüp reels kaydı" : "Kulüp paylaşımı"),
      kind,
      takenAt: typeof item.timestamp === "string" ? item.timestamp : "",
    });
  }
  return byNewest(posts);
}

function fromPublicProfile(payload: unknown): InstagramPost[] {
  const root = payload as {
    data?: { user?: { edge_owner_to_timeline_media?: { edges?: { node?: Record<string, unknown> }[] } } };
  };
  const edges = root.data?.user?.edge_owner_to_timeline_media?.edges ?? [];
  const posts: InstagramPost[] = [];

  for (const edge of edges) {
    const node = edge.node;
    if (!node) continue;
    const code = typeof node.shortcode === "string" ? node.shortcode : "";
    const video = node.is_video === true || node.product_type === "clips";
    const imageUrl =
      (typeof node.display_url === "string" && node.display_url) ||
      (typeof node.thumbnail_src === "string" && node.thumbnail_src) ||
      "";
    const versions = node.video_versions as { url?: string }[] | undefined;
    const versionUrl = versions?.find((item) => typeof item?.url === "string")?.url ?? "";
    const rawVideo = typeof node.video_url === "string" ? node.video_url : versionUrl;
    const videoUrl = remoteVideoUrl(video, rawVideo);
    if (!code || (!imageUrl && !videoUrl)) continue;
    const taken = typeof node.taken_at_timestamp === "number" ? new Date(node.taken_at_timestamp * 1000).toISOString() : "";
    const edgesCaption = node.edge_media_to_caption as { edges?: { node?: { text?: string } }[] } | undefined;
    const text = edgesCaption?.edges?.[0]?.node?.text ?? "";
    posts.push({
      id: code,
      href: video ? `${INSTAGRAM_URL}reel/${code}/` : `${INSTAGRAM_URL}p/${code}/`,
      imageUrl,
      videoUrl,
      caption: shorten(text, video ? "Kulüp reels kaydı" : "Kulüp paylaşımı"),
      kind: video ? "Reel" : "Gönderi",
      takenAt: taken,
    });
  }

  return byNewest(posts);
}

async function readJson(url: string, headers: HeadersInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers,
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFreshPosts() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const userId = process.env.INSTAGRAM_USER_ID?.trim();
  if (token) {
    const url = new URL(`https://graph.instagram.com/v21.0/${userId || "me"}/media`);
    url.searchParams.set("fields", "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp");
    url.searchParams.set("limit", "6");
    url.searchParams.set("access_token", token);
    const payload = await readJson(url.toString(), { Accept: "application/json" });
    const items = payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
      ? ((payload as { data: unknown[] }).data)
      : [];
    const posts = fromGraph(items);
    if (posts.length > 0) return posts;
  }

  const payload = await readJson(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${INSTAGRAM_HANDLE}`,
    {
      "x-ig-app-id": "936619743392459",
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0",
    },
  );
  return payload ? fromPublicProfile(payload) : [];
}

export async function loadRecentInstagramPosts(): Promise<InstagramPost[]> {
  const mode = process.env.INSTAGRAM_ACCESS_TOKEN?.trim() ? "graph" : "public";
  const loadCachedPosts = unstable_cache(
    async () => {
      const posts = await fetchFreshPosts();
      if (posts.length === 0) throw new Error("instagram-empty");
      return posts;
    },
    ["gazi-gezi-instagram", mode],
    { revalidate: FIVE_HOURS },
  );

  try {
    const posts = await loadCachedPosts();
    if (posts.length > 0) {
      lastSuccess = { at: Date.now(), posts };
      return posts;
    }
  } catch {
    if (lastSuccess && Date.now() - lastSuccess.at < FIVE_HOURS * 1000) return lastSuccess.posts;
  }
  return [];
}
