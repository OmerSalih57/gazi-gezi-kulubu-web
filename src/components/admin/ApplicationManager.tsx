"use client";

import { useMemo, useState } from "react";
import { saveApplicationForm, updateApplicationStatus } from "@/actions/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type QuestionDraft = { key: string; prompt: string; required: boolean };

export type StoredApplication = {
  id: string;
  fullName: string;
  departmentClass: string;
  studentNo: string;
  phone: string;
  departments: string[];
  answers: { prompt: string; answer: string }[];
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

const STATUS_LABEL = {
  pending: "İnceleniyor",
  approved: "Kabul",
  rejected: "Red",
};

export function ApplicationManager({
  ready,
  initial,
  applications,
}: {
  ready: boolean;
  initial: {
    isAccepting: boolean;
    closingMessage: string;
    title: string;
    description: string;
    departments: string[];
    questions: { prompt: string; required: boolean }[];
  };
  applications: StoredApplication[];
}) {
  const [tab, setTab] = useState<"settings" | "list">("list");
  const [isAccepting, setIsAccepting] = useState(initial.isAccepting);
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initial.questions.map((question, index) => ({ key: `${index}`, prompt: question.prompt, required: question.required })),
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [rows, setRows] = useState(applications);

  const departments = useMemo(
    () => [...new Set(rows.flatMap((row) => row.departments))].sort((a, b) => a.localeCompare(b, "tr")),
    [rows],
  );
  const visible = rows.filter((row) => {
    const statusOk = statusFilter === "all" || row.status === statusFilter;
    const departmentOk = departmentFilter === "all" || row.departments.includes(departmentFilter);
    return statusOk && departmentOk;
  });

  const save = async (formData: FormData) => {
    setPending(true);
    setError(null);
    setMessage(null);
    const departmentText = String(formData.get("departments") || "");
    const result = await saveApplicationForm({
      isAccepting,
      closingMessage: formData.get("closingMessage"),
      title: formData.get("title"),
      description: formData.get("description"),
      departments: departmentText.split("\n").map((line) => line.trim()).filter(Boolean),
      questions: questions.filter((question) => question.prompt.trim()).map((question) => ({
        prompt: question.prompt,
        required: question.required,
      })),
    });
    setPending(false);
    if (!result.ok) setError(result.error);
    else setMessage("Form ayarları kaydedildi.");
  };

  const setStatus = async (id: string, status: StoredApplication["status"]) => {
    const result = await updateApplicationStatus(id, status);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
  };

  const exportHref = `/api/export/basvurular?status=${encodeURIComponent(statusFilter)}&department=${encodeURIComponent(departmentFilter)}`;

  if (!ready) {
    return (
      <p className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        Başvuru tabloları henüz yok. supabase/migrations/0006_profile_team_reviews.sql dosyasını çalıştırın.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-950">Ekip başvuruları</h1>
          <p className="mt-1 text-sm text-neutral-500">Formu buradan açıp kapatabilir, gelen kayıtları inceleyebilirsin.</p>
        </div>
        <div className="flex rounded-full bg-neutral-100 p-1 text-xs font-semibold">
          <button type="button" onClick={() => setTab("settings")} className={`rounded-full px-3 py-1 ${tab === "settings" ? "bg-neutral-950 text-white" : "text-neutral-600"}`}>
            Form ayarları
          </button>
          <button type="button" onClick={() => setTab("list")} className={`rounded-full px-3 py-1 ${tab === "list" ? "bg-neutral-950 text-white" : "text-neutral-600"}`}>
            Başvurular
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      {tab === "settings" ? (
        <form action={save} className="space-y-4 rounded-[2rem] border border-neutral-200 bg-white p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
            <input type="checkbox" checked={isAccepting} onChange={(event) => setIsAccepting(event.target.checked)} />
            Başvurular açık
          </label>
          <div className="space-y-1">
            <Label htmlFor="title">Başlık</Label>
            <Input id="title" name="title" defaultValue={initial.title} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Açıklama</Label>
            <textarea id="description" name="description" defaultValue={initial.description} className="min-h-24 w-full rounded-2xl border border-neutral-200 px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="closingMessage">Kapalıyken gösterilecek mesaj</Label>
            <textarea id="closingMessage" name="closingMessage" defaultValue={initial.closingMessage} className="min-h-20 w-full rounded-2xl border border-neutral-200 px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="departments">Ekipler (her satıra bir tane)</Label>
            <textarea id="departments" name="departments" defaultValue={initial.departments.join("\n")} className="min-h-32 w-full rounded-2xl border border-neutral-200 px-3 py-2 text-sm" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900">Yazılı sorular</h2>
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuestions((current) => [...current, { key: crypto.randomUUID(), prompt: "", required: true }])}
              >
                Soru ekle
              </Button>
            </div>
            {questions.map((question, index) => (
              <div key={question.key} className="grid gap-2 rounded-2xl bg-neutral-50 p-3 sm:grid-cols-[1fr_auto_auto]">
                <Input
                  value={question.prompt}
                  onChange={(event) =>
                    setQuestions((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, prompt: event.target.value } : item)))
                  }
                  placeholder="Soru metni"
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(event) =>
                      setQuestions((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, required: event.target.checked } : item)))
                    }
                  />
                  Zorunlu
                </label>
                <Button type="button" variant="ghost" onClick={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                  Sil
                </Button>
              </div>
            ))}
          </div>
          <Button type="submit" disabled={pending} className="bg-orange-600 text-white hover:bg-orange-700">
            Ayarları kaydet
          </Button>
        </form>
      ) : (
        <section className="space-y-4 rounded-[2rem] border border-neutral-200 bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm">
              <option value="all">Tüm durumlar</option>
              <option value="pending">İnceleniyor</option>
              <option value="approved">Kabul</option>
              <option value="rejected">Red</option>
            </select>
            <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm">
              <option value="all">Tüm ekipler</option>
              {departments.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
            <a href={exportHref} className="rounded-full bg-neutral-950 px-3 py-1.5 text-sm font-semibold text-white">
              Excel indir
            </a>
          </div>
          {visible.length === 0 ? (
            <p className="text-sm text-neutral-500">Bu filtrede başvuru yok.</p>
          ) : (
            <ul className="space-y-3">
              {visible.map((row) => (
                <li key={row.id} className="rounded-2xl bg-neutral-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-neutral-900">{row.fullName}</p>
                      <p className="text-xs text-neutral-500">
                        {row.departmentClass} · {row.studentNo} · {row.phone}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">{row.createdAt}</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-neutral-700">{STATUS_LABEL[row.status]}</span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-700">Ekipler: {row.departments.join(", ") || "—"}</p>
                  <ul className="mt-2 space-y-1">
                    {row.answers.map((answer) => (
                      <li key={answer.prompt} className="text-sm text-neutral-700">
                        <span className="font-semibold">{answer.prompt}</span> {answer.answer || "—"}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["pending", "approved", "rejected"] as const).map((status) => (
                      <Button key={status} type="button" variant="outline" onClick={() => setStatus(row.id, status)}>
                        {STATUS_LABEL[status]}
                      </Button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
