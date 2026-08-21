import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.js";

export async function getMyGraduation(
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

    const student = await prisma.student.findUnique({
      where: {
        userId: req.user.id,
      },
      select: {
        id: true,
        studentNumber: true,
        fullName: true,
        graduation: true,
      },
    });

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Data siswa tidak ditemukan.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          studentNumber: student.studentNumber,
          fullName: student.fullName,
        },
        graduation: student.graduation,
      },
    });
  } catch (error) {
    console.error("[ERROR] getMyGraduation:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}
