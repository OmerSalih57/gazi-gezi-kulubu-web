export type ItineraryStop = {
  time: string;
  title: string;
  description: string;
};

export type RouteHighlight = {
  title: string;
  description: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function readItinerary(value: unknown): ItineraryStop[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = asRecord(item);
    if (!row) return [];
    const title = String(row.title || "").trim();
    if (!title) return [];
    return [{ time: String(row.time || "").trim(), title, description: String(row.description || "").trim() }];
  });
}

export function readHighlights(value: unknown): RouteHighlight[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = asRecord(item);
    if (!row) return [];
    const title = String(row.title || "").trim();
    if (!title) return [];
    return [{ title, description: String(row.description || "").trim() }];
  });
}

export function parseItinerary(text: string): ItineraryStop[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 16)
    .map((line) => {
      const [time = "", title = "", description = ""] = line.split("|").map((part) => part.trim());
      return {
        time,
        title: title || time || "Durak",
        description,
      };
    });
}

export function parseHighlights(text: string): RouteHighlight[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((line) => {
      const [title = "", description = ""] = line.split("|").map((part) => part.trim());
      return { title: title || "Durak", description };
    });
}

export function serializeItinerary(stops: ItineraryStop[]) {
  return stops.map((stop) => [stop.time, stop.title, stop.description].filter(Boolean).join(" | ")).join("\n");
}

export function serializeHighlights(items: RouteHighlight[]) {
  return items.map((item) => [item.title, item.description].filter(Boolean).join(" | ")).join("\n");
}

export function fallbackItinerary(event: { title: string; starts_at: string; ends_at: string | null }): ItineraryStop[] {
  const start = new Date(event.starts_at);
  const startTime = Number.isNaN(start.getTime())
    ? ""
    : start.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const stops: ItineraryStop[] = [
    {
      time: startTime,
      title: "Buluşma ve hareket",
      description: `${event.title} için ilan edilen buluşma saati.`,
    },
  ];
  if (event.ends_at) {
    const end = new Date(event.ends_at);
    if (!Number.isNaN(end.getTime())) {
      stops.push({
        time: end.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        title: "Dönüş",
        description: "Program kapanır ve dönüş başlar.",
      });
    }
  }
  return stops;
}

export function fallbackHighlights(event: { title: string; starts_at: string }): RouteHighlight[] {
  const start = new Date(event.starts_at);
  const when = Number.isNaN(start.getTime())
    ? "Tarih gezi sayfasında"
    : start.toLocaleDateString("tr-TR", { dateStyle: "long" });
  return [
    { title: event.title, description: "Bu gezinin ana durağı." },
    { title: when, description: "Hareket günü." },
  ];
}
