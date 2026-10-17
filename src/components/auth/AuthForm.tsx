"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/auth/safe-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const authField =
  "h-auto rounded-xl border-zinc-200 bg-zinc-50/80 px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-amber-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus-visible:bg-zinc-950";

export default function AuthForm({ next }: { next?: string }) {
  const supabase = createClient();
  const dest = safeNext(next);

  const [mode, setMode] = useState<"giris" | "kayit">("giris");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(null);

  const callbackUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=${encodeURIComponent(dest)}`;

  async function google() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setMessage({ type: "error", text: "Google ile giriş başlatılamadı." });
      setLoading(false);
    }
  }

  // async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
  //   e.preventDefault();
  //   setLoading(true);
  //   setMessage(null);
  //   const form = new FormData(e.currentTarget);
  //   const email = String(form.get("email")).trim();
  //   const password = String(form.get("password"));

  //   if (mode === "giris") {
  //     const { error } = await supabase.auth.signInWithPassword({ email, password });
  //     if (error) {
  //       setMessage({ type: "error", text: "E-posta veya şifre hatalı (ya da e-posta henüz doğrulanmadı)." });
  //     } else {
  //       router.replace(dest);
  //       router.refresh();
  //     }
  //   } else {
  //     const { error } = await supabase.auth.signUp({
  //       email,
  //       password,
  //       options: {
  //         data: { full_name: String(form.get("full_name")).trim() },
  //         emailRedirectTo: callbackUrl,
  //       },
  //     });
  //     if (error) {
  //       setMessage({ type: "error", text: error.message });
  //     } else {
  //       setMessage({
  //         type: "info",
  //         text: "Doğrulama bağlantısı e-postana gönderildi. Maili onayladıktan sonra giriş yapabilirsin.",
  //       });
  //     }
  //   }
  //   setLoading(false);
  // }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));

    if (mode === "giris") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setMessage({ type: "error", text: "E-posta veya şifre hatalı (ya da e-posta henüz doğrulanmadı)." });
        setLoading(false);
      } else if (data.session) {
        // Tarayıcı çerezi yazıldıktan sonra tam sayfa yüklemesi, proxy ve navbar'ın aynı oturumu görmesini sağlar.
        window.location.assign(dest);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: String(form.get("full_name")).trim() },
          emailRedirectTo: callbackUrl,
        },
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "info",
          text: "Doğrulama bağlantısı e-postana gönderildi. Maili onayladıktan sonra giriş yapabilirsin.",
        });
      }
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <h1 className="text-2xl font-bold tracking-tight">
        {mode === "giris" ? "Giriş yap" : "Hesap oluştur"}
      </h1>

      <Button type="button" variant="outline" className="h-11 w-full rounded-xl border-zinc-700 bg-white text-zinc-950 hover:bg-zinc-100 hover:text-zinc-950" onClick={google} disabled={loading}>
        Google ile devam et
      </Button>

      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" /> veya <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "kayit" && (
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Ad Soyad</Label>
            <Input id="full_name" name="full_name" required minLength={3} autoComplete="name" className={authField} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" className={authField} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "giris" ? "current-password" : "new-password"}
            className={authField}
          />
        </div>

        {message && (
          <p className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-green-700"}>
            {message.text}
          </p>
        )}

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-semibold text-white shadow-lg shadow-orange-500/20 hover:from-amber-400 hover:to-orange-500"
          disabled={loading}
        >
          {mode === "giris" ? "Giriş yap" : "Kayıt ol"}
        </Button>
      </form>

      <button
        type="button"
        className="text-sm text-zinc-600 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-amber-600 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-amber-300"
        onClick={() => {
          setMode(mode === "giris" ? "kayit" : "giris");
          setMessage(null);
        }}
      >
        {mode === "giris" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
      </button>
    </div>
  );
}

