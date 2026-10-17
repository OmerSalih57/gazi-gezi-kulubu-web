import { z } from "zod";
import { isValidTcKimlik } from "@/lib/validations/registration";

export const profileDetailsSchema = z.object({
  fullName: z.string().trim().min(3, "Ad soyad en az 3 karakter olmalıdır").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+ ()-]{10,20}$/, "Geçerli bir telefon numarası giriniz"),
  tcNo: z
    .string()
    .trim()
    .length(11, "T.C. Kimlik No 11 haneli olmalıdır")
    .refine(isValidTcKimlik, "Geçerli bir T.C. Kimlik Numarası giriniz"),
  studentNo: z.string().trim().max(20, "Öğrenci numarası çok uzun").optional(),
});

export const passwordChangeSchema = z
  .object({
    password: z.string().min(8, "Yeni şifre en az 8 karakter olmalıdır").max(72),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    message: "Şifre tekrarı eşleşmiyor",
    path: ["confirm"],
  });
