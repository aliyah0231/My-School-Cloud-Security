import type { Request, Response } from "express";
import argon2 from "argon2";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { loginSchema } from "../validators/auth.validator.js";
import {
  createAccessToken,
} from "../utils/jwt.js";
import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";


const ACCESS_COOKIE = "smk_access_token";

const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax" as const,
  maxAge: 8 * 60 * 60 * 1000,
  path: "/",
};

export async function login(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Data login tidak valid.",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, password } = result.data;

    console.log("[LOGIN] Username:", username);

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    console.log(
      "[LOGIN] User ditemukan:",
      user ? "YA" : "TIDAK",
    );

    if (!user || user.status !== "ACTIVE") {
      res.status(401).json({
        success: false,
        message: "Username atau password salah.",
      });
      return;
    }

    console.log("[LOGIN] User ID:", user.id);
    console.log("[LOGIN] Role:", user.role);
    console.log("[LOGIN] Status:", user.status);

    const validPassword = await argon2.verify(
      user.passwordHash,
      password,
    );

    console.log(
      "[LOGIN] Password valid:",
      validPassword ? "YA" : "TIDAK",
    );

    if (!validPassword) {
      res.status(401).json({
        success: false,
        message: "Username atau password salah.",
      });
      return;
    }

    console.log("[LOGIN] Membuat access token...");

    const token = createAccessToken({
      userId: user.id,
      role: user.role,
    });

    console.log(
      "[LOGIN] Access token berhasil dibuat.",
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    console.log(
      "[LOGIN] lastLoginAt berhasil diperbarui.",
    );

    res.cookie(
      ACCESS_COOKIE,
      token,
      cookieOptions,
    );

    console.log(
      "[LOGIN] Cookie berhasil dibuat.",
    );

    res.status(200).json({
      success: true,
      message: "Login berhasil.",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
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
      message: "Terjadi kesalahan pada server.",
    });
  }
}
export async function me(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication diperlukan.",
    });

    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    res.status(401).json({
      success: false,
      message: "User tidak ditemukan.",
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

export async function logout(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
 res.clearCookie(ACCESS_COOKIE, {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  path: "/",
});

  res.status(200).json({
    success: true,
    message: "Logout berhasil.",
  });
}