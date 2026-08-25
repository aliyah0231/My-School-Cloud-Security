import { z } from "zod";

/**
 * =========================================================
 * LOGIN
 * =========================================================
 */
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(
      3,
      "Username minimal 3 karakter",
    )
    .max(
      50,
      "Username maksimal 50 karakter",
    )
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Username hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung",
    ),

  password: z
    .string()
    .min(
      8,
      "Password minimal 8 karakter",
    )
    .max(
      128,
      "Password maksimal 128 karakter",
    ),

  /*
   * OTP bersifat opsional pada request pertama.
   * Jika MFA pengguna aktif, backend akan meminta
   * OTP Google Authenticator.
   */
  otp: z
    .string()
    .trim()
    .regex(
      /^\d{6}$/,
      "Kode MFA harus terdiri dari 6 digit",
    )
    .optional(),
});

export type LoginInput =
  z.infer<typeof loginSchema>;


/**
 * =========================================================
 * ENABLE MFA
 * =========================================================
 */
export const enableMfaSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(
      /^\d{6}$/,
      "Kode Google Authenticator harus terdiri dari 6 digit",
    ),
});

export type EnableMfaInput =
  z.infer<typeof enableMfaSchema>;