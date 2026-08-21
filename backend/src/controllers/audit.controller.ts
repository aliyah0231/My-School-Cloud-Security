import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.js";

export async function getAuditLogs(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication diperlukan.",
      });
      return;
    }

    if (
      req.user.role !== "STAF_TU" &&
      req.user.role !== "KEPALA_SEKOLAH"
    ) {
      res.status(403).json({
        success: false,
        message: "Akses ditolak.",
      });
      return;
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        role: true,
        action: true,
        resource: true,
        resourceId: true,
        ipAddress: true,
        status: true,
        metadata: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        logs,
      },
    });
  } catch (error) {
    console.error("[ERROR] getAuditLogs:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil audit log.",
    });
  }
}