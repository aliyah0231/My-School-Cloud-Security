import type {
  Request,
  Response,
} from "express";

import argon2 from "argon2";

import {
  prisma,
} from "../config/prisma.js";

import {
  loginSchema,
  enableMfaSchema,
} from "../validators/auth.validator.js";

import {
  createAccessToken,
} from "../utils/jwt.js";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  generateMfaSecret,
  generateMfaQrCode,
  verifyMfaToken,
} from "../services/mfa.service.js";

import {
  encryptSensitiveData,
  decryptSensitiveData,
} from "../services/encryption.service.js";

const ACCESS_COOKIE =
  "smk_access_token";


const cookieOptions = {
  httpOnly: true,

  /*
   * Untuk prototype lokal.
   * Pada production dengan HTTPS publik,
   * sebaiknya secure diubah menjadi true.
   */
  secure: false,

  sameSite: "lax" as const,

  maxAge:
    8 * 60 * 60 * 1000,

  path: "/",
};


/**
 * =========================================================
 * LOGIN
 * =========================================================
 */
export async function login(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const result =
      loginSchema.safeParse(
        req.body,
      );


    if (!result.success) {
      res.status(400).json({
        success: false,

        message:
          "Data login tidak valid.",

        errors:
          result.error.flatten()
            .fieldErrors,
      });

      return;
    }


    const {
      username,
      password,
      otp,
    } = result.data;


    const user =
      await prisma.user.findUnique({
        where: {
          username,
        },
      });


    /*
     * Tidak memberikan informasi
     * apakah username tertentu terdaftar.
     */
    if (
      !user ||
      user.status !== "ACTIVE"
    ) {
      res.status(401).json({
        success: false,

        message:
          "Username atau password salah.",
      });

      return;
    }


    /*
     * Verifikasi password menggunakan Argon2.
     */
    const validPassword =
      await argon2.verify(
        user.passwordHash,
        password,
      );


    if (!validPassword) {
      res.status(401).json({
        success: false,

        message:
          "Username atau password salah.",
      });

      return;
    }


    /**
     * =====================================================
     * MFA GOOGLE AUTHENTICATOR
     * =====================================================
     *
     * Jika MFA aktif pada akun:
     *
     * 1. Username/password sudah benar.
     * 2. Backend meminta kode OTP.
     * 3. Token/cookie BELUM dibuat.
     * 4. Token baru dibuat jika OTP valid.
     */
    if (
      user.mfaEnabled &&
      user.mfaSecret
    ) {

      /*
       * Request login pertama
       * belum menyertakan OTP.
       */
      if (!otp) {
        res.status(200).json({
          success: true,

          message:
            "Verifikasi MFA diperlukan.",

          data: {
            mfaRequired: true,
          },
        });

        return;
      }


      /*
       * Verifikasi OTP menggunakan
       * Google Authenticator / TOTP.
       *
       * verifyMfaToken() bersifat async
       * pada implementasi otplib v13.
       */
    const decryptedMfaSecret =
  decryptSensitiveData(
    user.mfaSecret,
  );

const validOtp =
  await verifyMfaToken(
    otp,
    decryptedMfaSecret,
  );


      if (!validOtp) {
        res.status(401).json({
          success: false,

          message:
            "Kode Google Authenticator tidak valid atau sudah kedaluwarsa.",
        });

        return;
      }
    }


    /**
     * =====================================================
     * MEMBUAT SESSION
     * =====================================================
     *
     * Token hanya dibuat setelah:
     *
     * - password benar
     * - MFA berhasil jika MFA aktif
     */
    const token =
      createAccessToken({
        userId:
          user.id,

        role:
          user.role,
      });


    await prisma.user.update({
      where: {
        id:
          user.id,
      },

      data: {
        lastLoginAt:
          new Date(),
      },
    });


    /*
     * Token disimpan pada HTTP-only cookie.
     */
    res.cookie(
      ACCESS_COOKIE,
      token,
      cookieOptions,
    );


    res.status(200).json({
      success: true,

      message:
        user.mfaEnabled
          ? "Login dan verifikasi MFA berhasil."
          : "Login berhasil.",

      data: {
        mfaRequired:
          false,

        user: {
          id:
            user.id,

          username:
            user.username,

          email:
            user.email,

          role:
            user.role,

          status:
            user.status,

          /*
           * Hanya status MFA.
           *
           * mfaSecret tidak pernah
           * dikirim kepada frontend.
           */
          mfaEnabled:
            user.mfaEnabled,
        },
      },
    });

  } catch (error) {
    console.error(
      "[ERROR] login:",
      error,
    );


    res.status(500).json({
      success: false,

      message:
        "Terjadi kesalahan pada server.",
    });
  }
}


/**
 * =========================================================
 * SETUP MFA
 * =========================================================
 *
 * Endpoint:
 *
 * POST /api/auth/mfa/setup
 *
 * Hanya dapat digunakan oleh user
 * yang sudah terautentikasi.
 */
export async function setupMfa(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {

    if (!req.user) {
      res.status(401).json({
        success: false,

        message:
          "Authentication diperlukan.",
      });

      return;
    }


    const user =
      await prisma.user.findUnique({
        where: {
          id:
            req.user.id,
        },

        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          mfaEnabled: true,
        },
      });


    if (!user) {
      res.status(404).json({
        success: false,

        message:
          "User tidak ditemukan.",
      });

      return;
    }


    /*
     * Tidak membuat konfigurasi baru
     * apabila MFA sudah aktif.
     */
    if (user.mfaEnabled) {
      res.status(400).json({
        success: false,

        message:
          "MFA sudah aktif pada akun ini.",
      });

      return;
    }


    /*
     * Generate secret TOTP baru.
     */
    const secret =
      generateMfaSecret();


    /*
     * Membuat QR Code Google Authenticator.
     */
    const qrCode =
      await generateMfaQrCode(
        user.username,
        secret,
      );


    /*
     * Secret disimpan ke database,
     * tetapi MFA masih FALSE.
     *
     * MFA baru dianggap aktif setelah
     * pengguna berhasil memasukkan
     * OTP pertama.
     */
    await prisma.user.update({
      where: {
        id:
          user.id,
      },

      data: {
  mfaSecret:
    encryptSensitiveData(
      secret,
    ),

  mfaEnabled:
    false,
},
    });


    res.status(200).json({
      success: true,

      message:
        "Setup MFA berhasil dibuat. Scan QR Code menggunakan Google Authenticator.",

      data: {
        qrCode,

        /*
         * Backup manual jika QR Code
         * gagal dipindai.
         *
         * Jangan tampilkan manualKey
         * pada screenshot laporan.
         */
        manualKey:
          secret,

        user: {
          username:
            user.username,

          role:
            user.role,
        },
      },
    });

  } catch (error) {
    console.error(
      "[ERROR] setupMfa:",
      error,
    );


    res.status(500).json({
      success: false,

      message:
        "Gagal membuat konfigurasi MFA.",
    });
  }
}


/**
 * =========================================================
 * ENABLE MFA
 * =========================================================
 *
 * Endpoint:
 *
 * POST /api/auth/mfa/enable
 *
 * Body:
 *
 * {
 *   "token": "123456"
 * }
 *
 * Token berasal dari Google Authenticator.
 */
export async function enableMfa(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {

    if (!req.user) {
      res.status(401).json({
        success: false,

        message:
          "Authentication diperlukan.",
      });

      return;
    }


    /*
     * Validasi kode OTP.
     */
    const parsed =
      enableMfaSchema.safeParse(
        req.body,
      );


    if (!parsed.success) {
      res.status(400).json({
        success: false,

        message:
          "Kode MFA tidak valid.",

        errors:
          parsed.error.flatten()
            .fieldErrors,
      });

      return;
    }


    const {
      token,
    } = parsed.data;


    const user =
      await prisma.user.findUnique({
        where: {
          id:
            req.user.id,
        },
      });


    if (!user) {
      res.status(404).json({
        success: false,

        message:
          "User tidak ditemukan.",
      });

      return;
    }


    /*
     * Setup QR Code harus dilakukan terlebih dahulu.
     */
    if (!user.mfaSecret) {
      res.status(400).json({
        success: false,

        message:
          "Setup MFA belum dilakukan.",
      });

      return;
    }


    if (user.mfaEnabled) {
      res.status(400).json({
        success: false,

        message:
          "MFA sudah aktif.",
      });

      return;
    }


    /*
     * PENTING:
     *
     * verifyMfaToken() sekarang async,
     * sehingga HARUS menggunakan await.
     */
const decryptedMfaSecret =
  decryptSensitiveData(
    user.mfaSecret,
  );

const valid =
  await verifyMfaToken(
    token,
    decryptedMfaSecret,
  );


    if (!valid) {
      res.status(400).json({
        success: false,

        message:
          "Kode Google Authenticator tidak valid atau sudah kedaluwarsa.",
      });

      return;
    }


    /*
     * OTP benar.
     *
     * MFA resmi diaktifkan.
     */
    await prisma.user.update({
      where: {
        id:
          user.id,
      },

      data: {
        mfaEnabled:
          true,
      },
    });


    res.status(200).json({
      success: true,

      message:
        "Google Authenticator berhasil diaktifkan.",
    });

  } catch (error) {
    console.error(
      "[ERROR] enableMfa:",
      error,
    );


    res.status(500).json({
      success: false,

      message:
        "Gagal mengaktifkan MFA.",
    });
  }
}


/**
 * =========================================================
 * STATUS MFA
 * =========================================================
 *
 * GET /api/auth/mfa/status
 */
export async function getMfaStatus(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {

    if (!req.user) {
      res.status(401).json({
        success: false,

        message:
          "Authentication diperlukan.",
      });

      return;
    }


    const user =
      await prisma.user.findUnique({
        where: {
          id:
            req.user.id,
        },

        select: {
          mfaEnabled:
            true,
        },
      });


    if (!user) {
      res.status(404).json({
        success: false,

        message:
          "User tidak ditemukan.",
      });

      return;
    }


    res.status(200).json({
      success: true,

      data: {
        mfaEnabled:
          user.mfaEnabled,
      },
    });

  } catch (error) {
    console.error(
      "[ERROR] getMfaStatus:",
      error,
    );


    res.status(500).json({
      success: false,

      message:
        "Gagal membaca status MFA.",
    });
  }
}


/**
 * =========================================================
 * USER YANG SEDANG LOGIN
 * =========================================================
 *
 * GET /api/auth/me
 */
export async function me(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {

  if (!req.user) {
    res.status(401).json({
      success: false,

      message:
        "Authentication diperlukan.",
    });

    return;
  }


  const user =
    await prisma.user.findUnique({
      where: {
        id:
          req.user.id,
      },

      select: {
        id:
          true,

        username:
          true,

        email:
          true,

        role:
          true,

        status:
          true,

        lastLoginAt:
          true,

        mfaEnabled:
          true,

        /*
         * SECURITY:
         *
         * mfaSecret sengaja TIDAK dipilih.
         *
         * Oleh karena itu secret Google
         * Authenticator tidak dapat ikut
         * terkirim melalui API /auth/me.
         */
      },
    });


  if (!user) {
    res.status(401).json({
      success: false,

      message:
        "User tidak ditemukan.",
    });

    return;
  }


  res.status(200).json({
    success: true,

    data: {
      user,
    },
  });
}


/**
 * =========================================================
 * LOGOUT
 * =========================================================
 */
export async function logout(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {

  res.clearCookie(
    ACCESS_COOKIE,
    {
      httpOnly:
        true,

      secure:
        false,

      sameSite:
        "lax",

      path:
        "/",
    },
  );


  res.status(200).json({
    success: true,

    message:
      "Logout berhasil.",
  });
}