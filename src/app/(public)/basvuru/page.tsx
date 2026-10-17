import type { ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/guards";
import { ApplicationForm, type FormQuestion } from "@/components/applications/ApplicationForm";

function asStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default async function ApplicationPage() {
  await connection();
  const supabase = await createClient();
  const me = await getCurrentProfile();
  const [{ data: settings, error: settingsError }, { data: questions, error: questionsError }, details] = await Promise.all([
    supabase.from("application_settings").select("is_accepting, closing_message, title, description, departments").eq("id", 1).maybeSingle(),
    supabase.from("application_questions").select("id, prompt, required, sort_order").order("sort_order", { ascending: true }),
    me
      ? supabase.from("profile_details").select("phone, student_no").eq("user_id", me.user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (settingsError || questionsError || !settings) {
    return (
      <ApplicationShell>
        <p className="rounded-3xl border border-amber-200/80 bg-white/90 px-5 py-4 text-sm text-amber-800 shadow-2xl backdrop-blur-xl dark:border-amber-400/30 dark:bg-zinc-900/80 dark:text-amber-100">
          Başvuru formu henüz hazır değil. Supabase SQL Editor’da supabase/migrations/0006_profile_team_reviews.sql dosyasını çalıştırın.
        </p>
      </ApplicationShell>
    );
  }

  if (!me) {
    return (
      <ApplicationShell>
        <section className="rounded-3xl border border-zinc-200/80 bg-white/90 px-6 py-12 text-zinc-900 shadow-2xl backdrop-blur-xl sm:px-10 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-600 uppercase">Ekip başvurusu</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">{settings.title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            Başvuru yalnızca giriş yapmış üyelere açıktır. Böylece her kayıt bir hesaba ve hız sınırına bağlanır.
          </p>
          <Link
            href="/giris?next=/basvuru"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:from-amber-600 hover:to-orange-700"
          >
            Giriş yap
          </Link>
        </section>
      </ApplicationShell>
    );
  }

  if (!settings.is_accepting) {
    return (
      <ApplicationShell>
        <section className="rounded-3xl border border-zinc-200/80 bg-white/90 px-6 py-12 text-zinc-900 shadow-2xl backdrop-blur-xl sm:px-10 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-amber-600 uppercase">Ekip başvurusu</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">{settings.title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{settings.closing_message}</p>
        </section>
      </ApplicationShell>
    );
  }

  const formQuestions: FormQuestion[] = ((questions as { id: string; prompt: string; required: boolean }[] | null) ?? []).map((question) => ({
    id: question.id,
    prompt: question.prompt,
    required: question.required,
  }));

  return (
    <ApplicationShell>
    <ApplicationForm
      title={settings.title}
      description={settings.description || ""}
      departments={asStrings(settings.departments)}
      questions={formQuestions}
      defaults={{
        fullName: me?.profile?.full_name || "",
        phone: details.data?.phone || "",
        studentNo: details.data?.student_no || "",
      }}
    />
    </ApplicationShell>
  );
}

function ApplicationShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-4 -my-8 min-h-[calc(100vh-8rem)] overflow-hidden bg-amber-50/20 px-4 py-10 sm:-mx-6 sm:px-6 sm:py-12 lg:-mx-8 lg:px-8 dark:bg-zinc-950 dark:bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(234,88,12,0.16),transparent_38%)]">
      <div className="relative mx-auto max-w-3xl">{children}</div>
    </div>
  );
}
