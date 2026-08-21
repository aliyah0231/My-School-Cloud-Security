import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Username hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung",
    ),

  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(128, "Password maksimal 128 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;