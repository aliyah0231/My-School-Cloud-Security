import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  calculateSha256,
} from "../utils/hash.js";

import {
  registerDocumentOnBlockchain,
} from "../services/blockchain/blockchain.service.js";

import type {
  Response,
} from "express";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  prisma,
} from "../config/prisma.js";

/**
 * =========================================================
 * HELPER PARAM ID
 * =========================================================
 */
function getParamId(
  value: string | string[] | undefined,
): string | null {
  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value.trim();
  }

  if (
    Array.isArray(value) &&
    typeof value[0] === "string" &&
    value[0].trim()
  ) {
    return value[0].trim();
  }

  return null;
}

/**
 * =========================================================
 * DAFTAR SELURUH IJAZAH
 * =========================================================
 *
 * GET /api/diplomas
 */
export async function getAllDiplomas(
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

    const allowedRoles = [
      "ADMIN",
      "STAF_TU",
      "KEPALA_SEKOLAH",
    ];

    if (
      !allowedRoles.includes(
        req.user.role,
      )
    ) {
      res.status(403).json({
        success: false,

        message:
          "Akses ditolak.",
      });

      return;
    }

    const diplomas =
      await prisma.diploma.findMany({
        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          documentNumber: true,
          verificationCode: true,
          documentName: true,
          fileHash: true,
          fileSize: true,
          mimeType: true,
          status: true,
          issuedAt: true,
          createdAt: true,

          student: {
            select: {
              id: true,
              studentNumber: true,
              fullName: true,
            },
          },
        },
      });

    const studentIds = [
      ...new Set(
        diplomas.map(
          (diploma) =>
            diploma.student.id,
        ),
      ),
    ];

    const classMembers =
      studentIds.length > 0
        ? await prisma.classMember.findMany({
            where: {
              studentId: {
                in:
                  studentIds,
              },
            },

            select: {
              studentId: true,

              class: {
                select: {
                  id: true,
                  name: true,
                  major: true,
                  academicYear: true,
                },
              },
            },
          })
        : [];

    const classMap = new Map<
      string,
      {
        id: string;
        name: string;
        major: string;
        academicYear: string;
      }
    >();

    for (
      const member of classMembers
    ) {
      if (
        !classMap.has(
          member.studentId,
        )
      ) {
        classMap.set(
          member.studentId,
          member.class,
        );
      }
    }

    const diplomaItems =
      diplomas.map(
        (diploma) => {
          const studentClass =
            classMap.get(
              diploma.student.id,
            ) ?? null;

          return {
            id:
              diploma.id,

            student: {
              id:
                diploma.student.id,

              studentNumber:
                diploma.student
                  .studentNumber,

              fullName:
                diploma.student
                  .fullName,
            },

            class:
              studentClass,

            diploma: {
              id:
                diploma.id,

              documentNumber:
                diploma.documentNumber,

              verificationCode:
                diploma.verificationCode,

              documentName:
                diploma.documentName,

              fileHash:
                diploma.fileHash,

              fileSize:
                diploma.fileSize,

              mimeType:
                diploma.mimeType,

              status:
                diploma.status,

              issuedAt:
                diploma.issuedAt,

              createdAt:
                diploma.createdAt,
            },
          };
        },
      );

    const totalDiplomas =
      diplomas.length;

    const approvedDiplomas =
      diplomas.filter(
        (diploma) =>
          diploma.status ===
          "APPROVED",
      ).length;

    const pendingDiplomas =
      diplomas.filter(
        (diploma) =>
          diploma.status ===
          "PENDING",
      ).length;

    const rejectedDiplomas =
      diplomas.filter(
        (diploma) =>
          diploma.status ===
          "REJECTED",
      ).length;

    const totalStudents =
      await prisma.student.count();

    res.status(200).json({
      success: true,

      data: {
        diplomas:
          diplomaItems,

        statistics: {
          totalStudents,
          totalDiplomas,
          approvedDiplomas,
          pendingDiplomas,
          rejectedDiplomas,
        },
      },
    });
  } catch (error) {
    console.error(
      "[ERROR] getAllDiplomas:",
      error,
    );

    res.status(500).json({
      success: false,

      message:
        "Gagal mengambil data ijazah.",
    });
  }
}

/**
 * =========================================================
 * IJAZAH SISWA SENDIRI
 * =========================================================
 *
 * GET /api/diplomas/me
 */
export async function getMyDiplomas(
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

    const student =
      await prisma.student.findUnique({
        where: {
          userId:
            req.user.id,
        },

        select: {
          id: true,
          studentNumber: true,
          fullName: true,

          diplomas: {
            select: {
              id: true,
              documentNumber: true,
              verificationCode: true,
              documentName: true,
              fileHash: true,
              fileSize: true,
              mimeType: true,
              status: true,
              issuedAt: true,
              createdAt: true,
            },

            orderBy: {
              createdAt:
                "desc",
            },
          },
        },
      });

    if (!student) {
      res.status(404).json({
        success: false,

        message:
          "Data siswa tidak ditemukan.",
      });

      return;
    }

    const diplomaItems =
      student.diplomas.map(
        (diploma) => ({
          id:
            diploma.id,

          student: {
            id:
              student.id,

            studentNumber:
              student.studentNumber,

            fullName:
              student.fullName,
          },

          class: null,

          diploma: {
            id:
              diploma.id,

            documentNumber:
              diploma.documentNumber,

            verificationCode:
              diploma.verificationCode,

            documentName:
              diploma.documentName,

            fileHash:
              diploma.fileHash,

            fileSize:
              diploma.fileSize,

            mimeType:
              diploma.mimeType,

            status:
              diploma.status,

            issuedAt:
              diploma.issuedAt,

            createdAt:
              diploma.createdAt,
          },
        }),
      );

    res.status(200).json({
      success: true,

      data: {
        diplomas:
          diplomaItems,

        statistics: {
          totalStudents: 1,

          totalDiplomas:
            student.diplomas.length,

          approvedDiplomas:
            student.diplomas.filter(
              (diploma) =>
                diploma.status ===
                "APPROVED",
            ).length,

          pendingDiplomas:
            student.diplomas.filter(
              (diploma) =>
                diploma.status ===
                "PENDING",
            ).length,

          rejectedDiplomas:
            student.diplomas.filter(
              (diploma) =>
                diploma.status ===
                "REJECTED",
            ).length,
        },
      },
    });
  } catch (error) {
    console.error(
      "[ERROR] getMyDiplomas:",
      error,
    );

    res.status(500).json({
      success: false,

      message:
        "Gagal mengambil data ijazah.",
    });
  }
}

/**
 * =========================================================
 * UPLOAD IJAZAH
 * =========================================================
 *
 * STAF TU
 *
 * POST /api/diplomas/upload
 */
export async function uploadDiploma(
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

    if (
      req.user.role !==
      "STAF_TU"
    ) {
      res.status(403).json({
        success: false,

        message:
          "Hanya Staf TU yang dapat mengupload ijazah.",
      });

      return;
    }

    const studentId =
      typeof req.body.studentId ===
      "string"
        ? req.body.studentId.trim()
        : "";

    if (!studentId) {
      if (
        req.file?.path
      ) {
        await fs
          .unlink(
            req.file.path,
          )
          .catch(() => {});
      }

      res.status(400).json({
        success: false,

        message:
          "Siswa wajib dipilih.",
      });

      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,

        message:
          "File ijazah wajib diupload.",
      });

      return;
    }

    const student =
      await prisma.student.findUnique({
        where: {
          id:
            studentId,
        },

        select: {
          id: true,
          studentNumber: true,
          fullName: true,
        },
      });

    if (!student) {
      await fs
        .unlink(
          req.file.path,
        )
        .catch(() => {});

      res.status(404).json({
        success: false,

        message:
          "Data siswa tidak ditemukan.",
      });

      return;
    }

    const fileBuffer =
      await fs.readFile(
        req.file.path,
      );

    const fileHash =
      calculateSha256(
        fileBuffer,
      );

    const documentNumber =
      `IJZ-${student.studentNumber}-${Date.now()}`;

    const verificationCode =
      `DIP-${randomUUID()
        .replace(/-/g, "")
        .substring(0, 16)
        .toUpperCase()}`;

    const blockchainResult =
      await registerDocumentOnBlockchain(
        verificationCode,
        "DIPLOMA",
        fileHash,
      );

    const diploma =
      await prisma.diploma.create({
        data: {
          studentId:
            student.id,

          documentNumber,
          verificationCode,

          documentName:
            req.file.originalname,

          filePath:
            path.relative(
              process.cwd(),
              req.file.path,
            ),

          fileHash,

          fileSize:
            req.file.size,

          mimeType:
            req.file.mimetype,

          status:
            "PENDING",
        },

        select: {
          id: true,
          documentNumber: true,
          verificationCode: true,
          documentName: true,
          fileHash: true,
          fileSize: true,
          mimeType: true,
          status: true,
          createdAt: true,
        },
      });

    console.log(
      "[BLOCKCHAIN] Ijazah berhasil didaftarkan",
    );

    console.log(
      "[BLOCKCHAIN] Verification Code:",
      verificationCode,
    );

    console.log(
      "[BLOCKCHAIN] SHA-256:",
      fileHash,
    );

    console.log(
      "[BLOCKCHAIN] Transaction Hash:",
      blockchainResult
        .transactionHash,
    );

    res.status(201).json({
      success: true,

      message:
        "Ijazah berhasil diupload dan hash berhasil dicatat ke blockchain.",

      data: {
        ...diploma,

        student: {
          id:
            student.id,

          studentNumber:
            student.studentNumber,

          fullName:
            student.fullName,
        },

        blockchain: {
          transactionHash:
            blockchainResult
              .transactionHash,
        },
      },
    });
  } catch (error) {
    console.error(
      "[ERROR] uploadDiploma:",
      error,
    );

    if (
      req.file?.path
    ) {
      await fs
        .unlink(
          req.file.path,
        )
        .catch(() => {});
    }

    res.status(500).json({
      success: false,

      message:
        "Gagal mengupload ijazah atau mencatat hash ke blockchain.",
    });
  }
}

/**
 * =========================================================
 * FILE IJAZAH
 * =========================================================
 *
 * GET /api/diplomas/:id/file
 */
export async function getDiplomaFile(
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

    const id =
      getParamId(
        req.params.id,
      );

    if (!id) {
      res.status(400).json({
        success: false,

        message:
          "ID ijazah tidak valid.",
      });

      return;
    }

    const diploma =
      await prisma.diploma.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          documentName: true,
          filePath: true,
          mimeType: true,

          student: {
            select: {
              userId: true,
            },
          },
        },
      });

    if (!diploma) {
      res.status(404).json({
        success: false,

        message:
          "Ijazah tidak ditemukan.",
      });

      return;
    }

    if (
      req.user.role ===
        "SISWA" &&
      diploma.student.userId !==
        req.user.id
    ) {
      res.status(403).json({
        success: false,

        message:
          "Kamu tidak memiliki akses ke file ijazah ini.",
      });

      return;
    }

    const allowedRoles = [
      "SISWA",
      "STAF_TU",
      "ADMIN",
      "KEPALA_SEKOLAH",
    ];

    if (
      !allowedRoles.includes(
        req.user.role,
      )
    ) {
      res.status(403).json({
        success: false,

        message:
          "Akses ditolak.",
      });

      return;
    }

    const absolutePath =
      path.resolve(
        process.cwd(),
        diploma.filePath,
      );

    try {
      await fs.access(
        absolutePath,
      );
    } catch {
      res.status(404).json({
        success: false,

        message:
          "File ijazah tidak ditemukan di server.",
      });

      return;
    }

    res.setHeader(
      "Content-Type",
      diploma.mimeType,
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${diploma.documentName}"`,
    );

    res.sendFile(
      absolutePath,
    );
  } catch (error) {
    console.error(
      "[ERROR] getDiplomaFile:",
      error,
    );

    res.status(500).json({
      success: false,

      message:
        "Gagal mengambil file ijazah.",
    });
  }
}

/**
 * =========================================================
 * SETUJUI IJAZAH
 * =========================================================
 *
 * KEPALA SEKOLAH
 *
 * PATCH /api/diplomas/:id/approve
 */
export async function approveDiploma(
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

    if (
      req.user.role !==
      "KEPALA_SEKOLAH"
    ) {
      res.status(403).json({
        success: false,

        message:
          "Hanya Kepala Sekolah yang dapat menyetujui ijazah.",
      });

      return;
    }

    const id =
      getParamId(
        req.params.id,
      );

    if (!id) {
      res.status(400).json({
        success: false,

        message:
          "ID ijazah tidak valid.",
      });

      return;
    }

    const diploma =
      await prisma.diploma.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          documentNumber: true,
          verificationCode: true,
          documentName: true,
          status: true,
          issuedAt: true,
        },
      });

    if (!diploma) {
      res.status(404).json({
        success: false,

        message:
          "Ijazah tidak ditemukan.",
      });

      return;
    }

    if (
      diploma.status ===
      "APPROVED"
    ) {
      res.status(400).json({
        success: false,

        message:
          "Ijazah sudah disetujui sebelumnya.",
      });

      return;
    }

    if (
      diploma.status ===
      "REJECTED"
    ) {
      res.status(400).json({
        success: false,

        message:
          "Ijazah yang sudah ditolak tidak dapat disetujui.",
      });

      return;
    }

    const updatedDiploma =
      await prisma.diploma.update({
        where: {
          id,
        },

        data: {
          status:
            "APPROVED",

          issuedAt:
            new Date(),
        },

        select: {
          id: true,
          documentNumber: true,
          verificationCode: true,
          documentName: true,
          status: true,
          issuedAt: true,
          createdAt: true,

          student: {
            select: {
              id: true,
              studentNumber: true,
              fullName: true,
            },
          },
        },
      });

    console.log(
      "[APPROVAL] Ijazah disetujui:",
      updatedDiploma
        .documentNumber,
    );

    console.log(
      "[APPROVAL] Disetujui oleh:",
      req.user.id,
    );

    console.log(
      "[APPROVAL] Tanggal terbit:",
      updatedDiploma
        .issuedAt,
    );

    res.status(200).json({
      success: true,

      message:
        "Ijazah berhasil disetujui dan diterbitkan.",

      data:
        updatedDiploma,
    });
  } catch (error) {
    console.error(
      "[ERROR] approveDiploma:",
      error,
    );

    res.status(500).json({
      success: false,

      message:
        "Gagal menyetujui ijazah.",
    });
  }
}

/**
 * =========================================================
 * TOLAK IJAZAH
 * =========================================================
 *
 * KEPALA SEKOLAH
 *
 * PATCH /api/diplomas/:id/reject
 */
export async function rejectDiploma(
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

    if (
      req.user.role !==
      "KEPALA_SEKOLAH"
    ) {
      res.status(403).json({
        success: false,

        message:
          "Hanya Kepala Sekolah yang dapat menolak ijazah.",
      });

      return;
    }

    const id =
      getParamId(
        req.params.id,
      );

    if (!id) {
      res.status(400).json({
        success: false,

        message:
          "ID ijazah tidak valid.",
      });

      return;
    }

    const diploma =
      await prisma.diploma.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          documentNumber: true,
          status: true,
        },
      });

    if (!diploma) {
      res.status(404).json({
        success: false,

        message:
          "Ijazah tidak ditemukan.",
      });

      return;
    }

    if (
      diploma.status ===
      "APPROVED"
    ) {
      res.status(400).json({
        success: false,

        message:
          "Ijazah yang sudah diterbitkan tidak dapat ditolak.",
      });

      return;
    }

    if (
      diploma.status ===
      "REJECTED"
    ) {
      res.status(400).json({
        success: false,

        message:
          "Ijazah sudah ditolak sebelumnya.",
      });

      return;
    }

    const updatedDiploma =
      await prisma.diploma.update({
        where: {
          id,
        },

        data: {
          status:
            "REJECTED",

          issuedAt:
            null,
        },

        select: {
          id: true,
          documentNumber: true,
          verificationCode: true,
          documentName: true,
          status: true,
          issuedAt: true,
          createdAt: true,
        },
      });

    console.log(
      "[REJECT] Ijazah ditolak:",
      updatedDiploma
        .documentNumber,
    );

    res.status(200).json({
      success: true,

      message:
        "Ijazah berhasil ditolak.",

      data:
        updatedDiploma,
    });
  } catch (error) {
    console.error(
      "[ERROR] rejectDiploma:",
      error,
    );

    res.status(500).json({
      success: false,

      message:
        "Gagal menolak ijazah.",
    });
  }
}