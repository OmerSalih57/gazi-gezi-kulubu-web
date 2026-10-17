"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useHeaderTone } from "@/components/layout/header-motion";

export type NavSession = {
  name: string;
  role: "student" | "editor" | "admin" | null;
};

function displayName(user: User, fullName?: string | null) {
  const meta = user.user_metadata?.full_name;
  const fromMeta = typeof meta === "string" ? meta : "";
  return (fullName || fromMeta || user.email || "Üye").trim() || "Üye";
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toLocaleUpperCase("tr-TR") || "Ü";
}

function asRole(value: unknown): NavSession["role"] {
  if (value === "admin" || value === "editor" || value === "student") return value;
  return null;
}

export function NavAuth({
  initial,
  size = "sm",
  tone,
}: {
  initial: NavSession | null;
  size?: "sm" | "xs";
  tone?: "light" | "onDark";
}) {
  const [session, setSession] = useState<NavSession | null>(initial);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function apply(user: User | null) {
      if (!user) {
        if (!cancelled) {
          setSession(null);
          setChecked(true);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;
      setSession({
        name: displayName(user, data?.full_name),
        role: asRole(data?.role),
      });
      setChecked(true);
    }

    void supabase.auth.getSession().then(({ data }) => {
      void apply(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      const user = next?.user ?? null;
      // Auth kilidi callback bitmeden başka bir Supabase isteğine verilmez.
      setTimeout(() => {
        void apply(user);
      }, 0);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const headerTone = useHeaderTone();
  const onDark = (tone ?? headerTone) === "onDark";

  if (!checked && !session) {
    return (
      <div
        className={`h-8 w-16 animate-pulse rounded-md ${onDark ? "bg-white/15" : "bg-neutral-100"}`}
        aria-hidden
      />
    );
  }

  if (!session) {
    return (
      <Link href="/giris">
        <Button
          size={size}
          className="bg-orange-600 text-xs text-white transition hover:bg-orange-700 hover:shadow-[0_0_18px_rgba(249,115,22,0.45)]"
        >
          Giriş Yap
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {session.role === "admin" && (
        <Link
          href="/yonetim"
          className="rounded-full bg-gradient-to-r from-orange-500 via-amber-200 to-orange-500 p-px text-xs font-semibold transition duration-300 hover:shadow-[0_0_18px_rgba(249,115,22,0.45)]"
        >
          <span
            className={`block rounded-full px-3 py-1.5 ${
              onDark ? "bg-neutral-950/55 text-white" : "bg-background/95 text-orange-700"
            }`}
          >
            YK Paneli
          </span>
        </Link>
      )}
      <Link
        href="/profil"
        title={session.name}
        aria-label={`Profil: ${session.name}`}
        className={`group inline-flex max-w-44 items-center gap-1.5 rounded-full border py-1 pr-1 pl-1 text-xs font-semibold no-underline transition duration-300 sm:pr-2.5 ${
          onDark
            ? "border-white/20 bg-white/10 text-zinc-200 backdrop-blur-md hover:border-amber-300/80 hover:bg-amber-400/15 hover:text-amber-300 hover:shadow-[0_0_22px_rgba(251,191,36,0.38)]"
            : "border-neutral-200 bg-white text-neutral-800 hover:border-amber-300 hover:text-orange-500 hover:shadow-[0_0_18px_rgba(251,191,36,0.28)] dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-100"
        }`}
      >
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
          {initials(session.name)}
        </span>
        <span className={`hidden truncate transition duration-300 sm:inline ${onDark ? "text-zinc-200 group-hover:text-amber-300" : "text-neutral-800 group-hover:text-orange-500 dark:text-zinc-100 dark:group-hover:text-amber-300"}`}>
          {session.name}
        </span>
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className={`rounded-full px-2.5 text-xs font-semibold transition duration-300 ${
            size === "xs" ? "h-6" : "h-7"
          } ${
            onDark
              ? "text-zinc-200 hover:bg-amber-400/15 hover:text-amber-300 hover:shadow-[0_0_18px_rgba(251,191,36,0.38)]"
              : "text-neutral-600 hover:bg-orange-50 hover:text-orange-500 dark:text-zinc-300 dark:hover:bg-amber-400/15 dark:hover:text-amber-300"
          }`}
        >
          Çıkış
        </button>
      </form>
    </div>
  );
}
