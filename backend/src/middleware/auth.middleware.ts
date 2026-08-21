import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { verifyAccessToken } from "../utils/jwt.js";

export interface AuthenticatedRequest
  extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const token =
    req.cookies?.smk_access_token;

  console.log(
    "[AUTH] Cookie:",
    token ? "ADA" : "TIDAK ADA",
  );

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication diperlukan.",
    });

    return;
  }

  try {
    const payload =
      verifyAccessToken(token);

    console.log(
      "[AUTH] User ID:",
      payload.userId,
    );

    console.log(
      "[AUTH] Role:",
      payload.role,
    );

    req.user = {
      id: payload.userId,
      role: payload.role,
    };

    next();
  } catch (error) {
    console.error(
      "[AUTH] Token error:",
      error,
    );

    res.status(401).json({
      success: false,
      message:
        "Session tidak valid atau sudah kedaluwarsa.",
    });
  }
}

export function requireRole(
  ...allowedRoles: string[]
) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication diperlukan.",
      });

      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message:
          "Kamu tidak memiliki permission untuk melakukan tindakan ini.",
      });

      return;
    }

    next();
  };
}