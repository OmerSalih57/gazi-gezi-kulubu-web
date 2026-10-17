import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { EventEditForm, type EventEditValues } from "@/components/admin/EventEditForm";
import { readHighlights, readItinerary, serializeHighlights, serializeItinerary } from "@/lib/events/story";
import type { EventItem, EventStatus } from "@/types/database";

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const STATUSES: EventStatus[] = ["draft", "open", "closed", "completed", "cancelled"];

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();

  const event = data as EventItem;
  const status = STATUSES.includes(event.status) ? event.status : "draft";

  const initial: EventEditValues = {
    title: event.title,
    slug: event.slug,
    description: event.description ?? "",
    cover_url: event.cover_url ?? "",
    starts_at: toDatetimeLocal(event.starts_at),
    ends_at: toDatetimeLocal(event.ends_at),
    registration_deadline: toDatetimeLocal(event.registration_deadline),
    price_try: Number(event.price_try) || 0,
    capacity: Number(event.capacity) || 1,
    payment_info: event.payment_info ?? "",
    status,
    itinerary_text: serializeItinerary(readItinerary(event.itinerary)),
    highlights_text: serializeHighlights(readHighlights(event.highlights)),
  };

  return <EventEditForm eventId={event.id} initial={initial} />;
}
