import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

const ACTIVE = ["pending_payment", "receipt_uploaded", "approved"];

export async function loadBookedMap(supabase: Client) {
  const view = await supabase.from("registration_occupancy").select("event_id, booked");
  if (!view.error) {
    const booked: Record<string, number> = {};
    for (const row of view.data ?? []) {
      if (typeof row.event_id === "string" && typeof row.booked === "number") {
        booked[row.event_id] = row.booked;
      }
    }
    return booked;
  }

  const legacy = await supabase.from("registrations").select("event_id").in("status", ACTIVE);
  const booked: Record<string, number> = {};
  for (const row of legacy.data ?? []) {
    if (typeof row.event_id === "string") booked[row.event_id] = (booked[row.event_id] || 0) + 1;
  }
  return booked;
}
