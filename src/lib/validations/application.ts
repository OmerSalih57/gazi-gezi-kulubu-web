import { z } from "zod";

export const applicationSettingsSchema = z.object({
  isAccepting: z.boolean(),
  closingMessage: z.string().trim().min(3, "Kapanış mesajı çok kısa").max(400),
  title: z.string().trim().min(3, "Başlık en az 3 karakter olmalıdır").max(120),
  description: z.string().trim().max(2000),
  departments: z.array(z.string().trim().min(2).max(40)).min(1, "En az bir ekip yazın").max(20),
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(5, "Soru en az 5 karakter olmalıdır").max(300),
        required: z.boolean(),
      }),
    )
    .max(12),
});

export type ApplicationSettingsInput = z.infer<typeof applicationSettingsSchema>;

export const applicationStatusSchema = z.enum(["pending", "approved", "rejected"]);
