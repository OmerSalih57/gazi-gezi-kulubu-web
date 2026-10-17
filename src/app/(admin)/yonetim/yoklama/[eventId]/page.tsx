import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { AttendanceManager } from "@/components/admin/AttendanceManager";

export default async function AdminAttendancePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  await connection();
  await requireAdmin();
  const { eventId } = await params;

  const supabase = await createClient();

  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, title, starts_at, capacity")
    .eq("id", eventId)
    .maybeSingle();

  if (eventErr || !event) {
    notFound();
  }

  // Yalnızca onaylı (bilet almış) yolcular yoklama listesinde yer alır
  const { data: rawRegistrations } = await supabase
    .from("registrations")
    .select("id, full_name, tc_no, phone, student_no, checked_in_at")
    .eq("event_id", eventId)
    .eq("status", "approved")
    .order("full_name", { ascending: true });

  const passengers = rawRegistrations || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/yonetim/geziler"
          className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          ← Geziler Listesine Dön
        </Link>
      </div>

      <div className="border-b pb-4">
        <span className="text-xs font-semibold text-orange-600 block">
          Etkinlik Yoklama ve Bilet Kontrolü
        </span>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900 mt-0.5">
          {event.title}
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Tarih: {new Date(event.starts_at).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })}
        </p>
      </div>

      <AttendanceManager
        eventId={event.id}
        eventTitle={event.title}
        passengers={passengers}
      />
    </div>
  );
}

