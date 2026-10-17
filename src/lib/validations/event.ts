import { z } from "zod";

export function slugify(text: string): string {
  const trMap: Record<string, string> = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  };

  return text
    .split("")
    .map((c) => trMap[c] || c)
    .join("")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const eventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Gezi başlığı en az 3 karakter olmalıdır")
    .max(150, "Gezi başlığı en fazla 150 karakter olabilir"),
  slug: z
    .string()
    .trim()
    .min(3, "Slug en az 3 karakter olmalıdır")
    .max(150, "Slug en fazla 150 karakter olabilir")
    .regex(/^[a-z0-9-]+$/, "Slug yalnızca küçük harf, rakam ve tire (-) içerebilir"),
  description: z.string().trim().optional(),
  cover_url: z.string().trim().optional(),
  starts_at: z.string().min(1, "Başlangıç tarihi ve saati zorunludur"),
  ends_at: z.string().optional(),
  registration_deadline: z.string().optional(),
  price_try: z.coerce
    .number()
    .min(0, "Ücret 0 veya daha büyük olmalıdır"),
  capacity: z.coerce
    .number()
    .int("Kontenjan tam sayı olmalıdır")
    .min(1, "Kontenjan en az 1 olmalıdır"),
  payment_info: z.string().trim().optional(),
  status: z.enum(["draft", "open", "closed", "completed", "cancelled"]).default("draft"),
  itinerary_text: z.string().optional(),
  highlights_text: z.string().optional(),
});

export type EventInput = z.infer<typeof eventSchema>;

/** Bitiş başlangıçtan önce, son kayıt başlangıçtan sonra olamaz. */
export function eventDateError(input: {
  starts_at: string;
  ends_at?: string;
  registration_deadline?: string;
}): string | null {
  const start = new Date(input.starts_at);
  if (Number.isNaN(start.getTime())) {
    return "Başlangıç tarihi geçersiz.";
  }

  if (input.ends_at) {
    const end = new Date(input.ends_at);
    if (Number.isNaN(end.getTime())) return "Bitiş tarihi geçersiz.";
    if (end < start) return "Bitiş tarihi başlangıçtan önce olamaz.";
  }

  if (input.registration_deadline) {
    const deadline = new Date(input.registration_deadline);
    if (Number.isNaN(deadline.getTime())) return "Son kayıt tarihi geçersiz.";
    if (deadline > start) return "Son kayıt tarihi gezi başlangıcından sonra olamaz.";
  }

  return null;
}
