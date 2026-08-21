import type { NextFunction, Response } from "express";
import { UserRole } from "@prisma/client";

import type { AuthenticatedRequest } from "./auth.middleware.js";
import { ROLE_PERMISSIONS } from "../constants/role-permissions.js";
import type { Permission } from "../constants/permissions.js";

export function requirePermission(
  permission: Permission,
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

    const role = req.user.role as UserRole;
    const permissions = ROLE_PERMISSIONS[role];

    if (!permissions) {
      res.status(403).json({
        success: false,
        message: "Role pengguna tidak valid.",
      });
      return;
    }

    if (!permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        message: "Kamu tidak memiliki permission untuk melakukan tindakan ini.",
      });
      return;
    }

    next();
  };
}