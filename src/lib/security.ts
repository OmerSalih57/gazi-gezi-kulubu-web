import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function clientIp() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const real = headerList.get("x-real-ip")?.trim() ?? "";
  const raw = forwarded || real;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(raw) || /^[0-9a-f:]{2,64}$/i.test(raw)) {
    return raw.slice(0, 64);
  }
  return "";
}

export async function enforceRateLimit(action: "team_application" | "trip_registration") {
  const supabase = await createClient();
  const ip = await clientIp();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !ip) {
    return { ok: false as const, error: "İstek doğrulanamadı. Lütfen yeniden deneyin." };
  }

  const { error } = await supabase.rpc("enforce_rate_limit", {
    p_action: action,
    p_ip: ip || null,
  });
  if (!error) return { ok: true as const };
  if (/çok sık|çok fazla/i.test(error.message)) {
    return { ok: false as const, error: "Çok sık deneme. Lütfen kısa bir süre sonra yeniden deneyin." };
  }
  if (/doğrulanamadı|giriş yapmalısınız/i.test(error.message)) {
    return { ok: false as const, error: "İstek doğrulanamadı. Lütfen yeniden deneyin." };
  }
  console.error("enforce_rate_limit", error.message);
  return { ok: false as const, error: "İstek şu anda kabul edilemedi. Lütfen kısa bir süre sonra yeniden deneyin." };
}
