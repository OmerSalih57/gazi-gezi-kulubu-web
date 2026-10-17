import { z } from "zod";

export function isValidTcKimlik(tc: string): boolean {
  if (!/^[1-9]\d{10}$/.test(tc)) return false;
  const digits = tc.split("").map(Number);
  const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  const d10 = (sum1 * 7 - sum2) % 10;
  const normalizedD10 = (d10 + 10) % 10;
  if (normalizedD10 !== digits[9]) return false;
  const sumAll10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sumAll10 % 10 !== digits[10]) return false;
  return digits[10] % 2 === 0;
}

export const registrationSchema = z.object({
  eventId: z.string().uuid("Geçersiz gezi kimliği"),
  eventSlug: z.string().min(1, "Gezi adresi zorunludur"),
  fullName: z
    .string()
    .trim()
    .min(3, "Ad Soyad en az 3 karakter olmalıdır")
    .max(100, "Ad Soyad en fazla 100 karakter olabilir"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+ ()-]{10,20}$/, "Geçerli bir telefon numarası giriniz (örn: 05xx xxx xx xx)"),
  tcNo: z
    .string()
    .trim()
    .length(11, "T.C. Kimlik No 11 haneli olmalıdır")
    .refine(isValidTcKimlik, "Geçerli bir T.C. Kimlik Numarası giriniz"),
  studentNo: z.string().trim().optional(),
  kvkkConsent: z
    .boolean()
    .refine((val) => val === true, "KVKK aydınlatma metnini onaylamanız gerekmektedir"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

