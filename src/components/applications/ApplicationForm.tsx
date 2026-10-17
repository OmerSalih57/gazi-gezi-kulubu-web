"use client";

import { useState, type FormEvent } from "react";
import { submitTeamApplication } from "@/actions/applications";
import { Label } from "@/components/ui/label";

export type FormQuestion = { id: string; prompt: string; required: boolean };

const fieldClass =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-950";

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

function isAvailabilityPrompt(prompt: string) {
  return /haftada/i.test(prompt) && /(zaman|gün)/i.test(prompt);
}

export function ApplicationForm({
  title,
  description,
  departments,
  questions,
  defaults,
}: {
  title: string;
  description: string;
  departments: string[];
  questions: FormQuestion[];
  defaults: { fullName: string; phone: string; studentNo: string };
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [weeklyDays, setWeeklyDays] = useState("3");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  const essays = questions.filter((question) => !isAvailabilityPrompt(question.prompt));

  const toggle = (department: string) => {
    setSelected((current) =>
      current.includes(department) ? current.filter((item) => item !== department) : [...current, department],
    );
  };

  const send = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const result = await submitTeamApplication({
        fullName: formData.get("fullName"),
        departmentClass: formData.get("departmentClass"),
        studentNo: formData.get("studentNo"),
        phone: formData.get("phone"),
        departments: selected,
        weeklyDays: Number(weeklyDays),
        answers: questions.map((question) => ({
          questionId: question.id,
          answer: isAvailabilityPrompt(question.prompt) ? `${weeklyDays} gün` : answers[question.id] || "",
        })),
        kvkkConsent: consent,
      });
      if (!result.ok) setError(result.error);
      else setDone(true);
    } catch {
      setError("Başvuru gönderilemedi. Bağlantını kontrol edip yeniden dene.");
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <section className="rounded-3xl border border-emerald-200/80 bg-white/90 p-6 text-center text-zinc-900 shadow-2xl backdrop-blur-xl sm:p-10 dark:border-emerald-400/30 dark:bg-zinc-900/80 dark:text-zinc-100">
        <h1 className="text-2xl font-black">Başvurun alındı</h1>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">Yönetim kurulu kaydını inceledikten sonra durumunu güncelleyecek.</p>
      </section>
    );
  }

  return (
    <form onSubmit={send} className="space-y-6 rounded-3xl border border-zinc-200/80 bg-white/90 p-6 text-zinc-900 shadow-2xl backdrop-blur-xl sm:p-10 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.18em] text-amber-600 uppercase">Gazi Gezi Kulübü</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-zinc-900 dark:text-zinc-100">Ad soyad</Label>
          <input id="fullName" name="fullName" defaultValue={defaults.fullName} required className={fieldClass} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="departmentClass" className="text-zinc-900 dark:text-zinc-100">Bölüm ve sınıf</Label>
          <input id="departmentClass" name="departmentClass" placeholder="Bilgisayar Mühendisliği, 3. sınıf" required className={fieldClass} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="studentNo" className="text-zinc-900 dark:text-zinc-100">Öğrenci numarası</Label>
          <input id="studentNo" name="studentNo" defaultValue={defaults.studentNo} required className={fieldClass} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-zinc-900 dark:text-zinc-100">Telefon</Label>
          <input id="phone" name="phone" defaultValue={defaults.phone} required className={fieldClass} />
        </div>
      </div>
      <fieldset>
        <legend className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Görev almak istediğin ekipler</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {departments.map((department) => {
            const active = selected.includes(department);
            return (
              <button
                key={department}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(department)}
                className={`rounded-full border px-4 py-2 text-sm transition-all ${
                  active
                    ? "border-amber-500 bg-amber-500 font-medium text-white shadow-md shadow-amber-500/20"
                    : "border-zinc-200 bg-zinc-100 font-medium text-zinc-700 hover:bg-amber-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {department}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="space-y-1.5">
        <Label htmlFor="weekly-days" className="text-zinc-900 dark:text-zinc-100">Haftada bu işe ne kadar zaman ayırabilirsin?</Label>
        <select
          id="weekly-days"
          value={weeklyDays}
          onChange={(event) => setWeeklyDays(event.target.value)}
          className={fieldClass}
        >
          {DAYS.map((day) => (
            <option key={day} value={day} className="bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
              {day} Gün
            </option>
          ))}
        </select>
      </div>
      {essays.map((question) => (
        <div key={question.id} className="space-y-1.5">
          <Label htmlFor={question.id} className="text-zinc-900 dark:text-zinc-100">
            {question.prompt}
            {question.required ? "" : " (isteğe bağlı)"}
          </Label>
          <textarea
            id={question.id}
            value={answers[question.id] || ""}
            onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
            required={question.required}
            className={`${fieldClass} min-h-28`}
          />
        </div>
      ))}
      <label className="flex items-start gap-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 size-4 rounded border-zinc-300 accent-amber-500"
        />
        Ad, bölüm, öğrenci numarası ve telefon bilgilerimin başvuru değerlendirmesi için saklanmasını kabul ediyorum.
      </label>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:from-amber-600 hover:to-orange-700 disabled:opacity-60"
      >
        {pending ? "Gönderiliyor..." : "Başvuruyu gönder"}
      </button>
    </form>
  );
}
