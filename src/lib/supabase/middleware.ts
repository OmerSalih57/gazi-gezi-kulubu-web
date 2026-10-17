import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/yonetim", "/profil", "/biletlerim"];

type SessionCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  let sessionCookies: SessionCookie[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list, headers) => {
          sessionCookies = list;
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          // Yeni Cookie başlığı, aynı istekteki Server Component'lere de gitsin.
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const redirectTo = (url: URL) => {
    const res = NextResponse.redirect(url);
    sessionCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    res.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
    return res;
  };

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return redirectTo(url);
  }

  if (pathname.startsWith("/yonetim") && user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return redirectTo(url);
    }
  }

  return response;
}
