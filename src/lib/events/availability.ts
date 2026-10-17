import type { EventStatus } from "@/types/database";

export type TripBadgeTone = "open" | "low" | "full" | "soon" | "done" | "closed";

export type TripBadge = {
  label: string;
  tone: TripBadgeTone;
};

export function remainingSeats(capacity: number, booked: number) {
  return Math.max(0, capacity - booked);
}

export function tripBadge(
  event: { status: EventStatus | string; capacity: number; starts_at: string },
  booked: number,
): TripBadge {
  const remaining = remainingSeats(event.capacity, booked);
  const starts = new Date(event.starts_at);
  const upcoming = !Number.isNaN(starts.getTime()) && starts.getTime() > Date.now();
  const almostFull = remaining > 0 && remaining <= Math.max(3, Math.ceil(event.capacity * 0.2));

  if (event.status === "completed") return { label: "Tamamlandı", tone: "done" };
  if (remaining === 0) return { label: "Tükendi", tone: "full" };
  if (event.status !== "open" && upcoming) return { label: "Yakında", tone: "soon" };
  if (event.status === "open" && almostFull) return { label: "Kontenjan Dolmak Üzere", tone: "low" };
  if (event.status === "open") return { label: "Kayıtlar Açık", tone: "open" };
  return { label: "Kapalı", tone: "closed" };
}

export function tripBadgeClass(tone: TripBadgeTone) {
  switch (tone) {
    case "low":
      return "bg-amber-500 text-white";
    case "full":
      return "bg-rose-600 text-white";
    case "soon":
      return "bg-sky-600 text-white";
    case "open":
      return "bg-emerald-500 text-white";
    case "done":
      return "bg-neutral-700 text-white";
    default:
      return "bg-neutral-900/80 text-white";
  }
}
