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
 * DAFTAR SELURUH SERTIFIKAT
 * =========================================================
 *
 * GET /api/certificates
 */
export async function getAllCertificates(
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
      "MITRA_INDUSTRI",
    ];

    if (
      !allowedRoles.includes(
        req.user.role,
      )
    ) {
      res.status(403).json({
        success: false,
        message: "Akses ditolak.",
      });

      return;
    }

    const certificates =
      await prisma.certificate.findMany({
        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          documentNumber: true,
          verificationCode: true,
          documentName: true,
          documentType: true,
          fileHash: true,
          fileSize: true,
          mimeType: true,
          institutionName: true,
          startDate: true,
          endDate: true,
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
        certificates.map(
          (certificate) =>
            certificate.student.id,
        ),
      ),
    ];

    const classMembers =
      studentIds.length > 0
        ? await prisma.classMember.findMany({
            where: {
              studentId: {
                in: studentIds,
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

    const certificateItems =
      certificates.map(
        (certificate) => {
          const studentClass =
            classMap.get(
              certificate.student.id,
            ) ?? null;

          return {
            id:
              certificate.id,

            student: {
              id:
                certificate.student.id,

              studentNumber:
                certificate.student
                  .studentNumber,

              fullName:
                certificate.student
                  .fullName,
            },

            class:
              studentClass,

            certificate: {
              id:
                certificate.id,

              documentNumber:
                certificate.documentNumber,

              verificationCode:
                certificate.verificationCode,

              documentName:
                certificate.documentName,

              documentType:
                certificate.documentType,

              fileHash:
                certificate.fileHash,

              fileSize:
                certificate.fileSize,

              mimeType:
                certificate.mimeType,

              institutionName:
                certificate.institutionName,

              startDate:
                certificate.startDate,

              endDate:
                certificate.endDate,

              status:
                certificate.status,

              issuedAt:
                certificate.issuedAt,

              createdAt:
                certificate.createdAt,
            },
          };
        },
      );

    const totalCertificates =
      certificates.length;

    const approvedCertificates =
      certificates.filter(
        (certificate) =>
          certificate.status ===
          "APPROVED",
      ).length;

    const pendingCertificates =
      certificates.filter(
        (certificate) =>
          certificate.status ===
          "PENDING",
      ).length;

    const rejectedCertificates =
      certificates.filter(
        (certificate) =>
          certificate.status ===
          "REJECTED",
      ).length;

    const totalStudents =
      await prisma.student.count();

    res.status(200).json({
      success: true,

      data: {
        certificates:
          certificateItems,

        statistics: {
          totalStudents,
          totalCertificates,
          approvedCertificates,
          pendingCertificates,
          rejectedCertificates,
        },
      },
    });
  } catch (error) {
    console.error(
      "[ERROR] getAllCertificates:",
      error,
    );

    res.status(500).json({
      success: false,

      message:
        "Gagal mengambil data sertifikat PKL atau magang.",
    });
  }
}

/**
 * =========================================================
 * SERTIFIKAT SISWA SENDIRI
 * =========================================================
 *
 * GET /api/certificates/me
 */
export async function getMyCertificates(
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

          certificates: {
            select: {
              id: true,
              documentNumber: true,
              verificationCode: true,
              documentName: true,
              documentType: true,
              fileHash: true,
              fileSize: true,
              mimeType: true,
              institutionName: true,
              startDate: true,
              endDate: true,
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

    const certificateItems =
      student.certificates.map(
        (certificate) => ({
          id:
            certificate.id,

          student: {
            id:
              student.id,

            studentNumber:
              student.studentNumber,

            fullName:
              student.fullName,
          },

          class: null,

          certificate: {
            id:
              certificate.id,

            documentNumber:
              certificate.documentNumber,

            verificationCode:
              certificate.verificationCode,

            documentName:
              certificate.documentName,

            documentType:
              certificate.documentType,

            fileHash:
              certificate.fileHash,

            fileSize:
              certificate.fileSize,

            mimeType:
              certificate.mimeType,

            institutionName:
              certificate.institutionName,

            startDate:
              certificate.startDate,

            endDate:
              certificate.endDate,

            status:
              certificate.status,

            issuedAt:
              certificate.issuedAt,

            createdAt:
              certificate.createdAt,
          },
        }),
      );

    res.status(200).json({
      success: true,

      data: {
        certificates:
          certificateItems,

        statistics: {
          totalStudents: 1,

          totalCertificates:
            student.certificates.length,

          approvedCertificates:
            student.certificates.filter(
              (certificate) =>
                certificate.status ===
                "APPROVED",
            ).length,

          pendingCertificates:
            student.certificates.filter(
              (certificate) =>
                certificate.status ===
                "PENDING",
            ).length,

          rejectedCertificates:
            student.certificates.filter(
              (certificate) =>
                certificate.status ===
                "REJECTED",
            ).length,
        },
      },
    });
  } catch (error) {
    console.error(
      "[ERROR] getMyCertificates:",
      error,
    );

    res.status(500).json({
      success: false,

      message:
        "Gagal mengambil sertifikat PKL atau magang.",
    });
  }
}

/**
 * =========================================================
 * UPLOAD SERTIFIKAT
 * =========================================================
 *
 * STAF TU
 *
 * POST /api/certificates/upload
 */
export async function uploadCertificate(
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
          "Hanya Staf TU yang dapat mengupload sertifikat.",
      });

      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,

        message:
          "File sertifikat wajib diupload.",
      });

      return;
    }

    const studentId =
      typeof req.body.studentId ===
      "string"
        ? req.body.studentId.trim()
        : "";

    if (!studentId) {
      await fs
        .unlink(
          req.file.path,
        )
        .catch(() => {});

      res.status(400).json({
        success: false,

        message:
          "Siswa wajib dipilih.",
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
      `CERT-${student.studentNumber}-${Date.now()}`;

    const verificationCode =
      `CERT-${randomUUID()
        .replace(/-/g, "")
        .substring(0, 16)
        .toUpperCase()}`;

    const documentType =
      req.body.documentType ===
      "INTERNSHIP_CERTIFICATE"
        ? "INTERNSHIP_CERTIFICATE"
        : "PKL_CERTIFICATE";

    const institutionName =
      typeof req.body
        .institutionName ===
        "string" &&
      req.body
        .institutionName
        .trim()
        ? req.body
            .institutionName
            .trim()
        : null;

    const startDate =
      req.body.startDate
        ? new Date(
            req.body.startDate,
          )
        : null;

    const endDate =
      req.body.endDate
        ? new Date(
            req.body.endDate,
          )
        : null;

    /*
     * Catat hash ke blockchain terlebih dahulu.
     */
    const blockchainResult =
      await registerDocumentOnBlockchain(
        verificationCode,
        documentType,
        fileHash,
      );

    /*
     * Simpan data database.
     */
    const certificate =
      await prisma.certificate.create({
        data: {
          studentId:
            student.id,

          documentNumber,
          verificationCode,

          documentName:
            req.file.originalname,

          documentType,

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

          institutionName,

          startDate,
          endDate,

          status:
            "PENDING",
        },

        select: {
          id: true,
          documentNumber: true,
          verificationCode: true,
          documentName: true,
          documentType: true,
          fileHash: true,
          fileSize: true,
          mimeType: true,
          institutionName: true,
          startDate: true,
          endDate: true,
          status: true,
          createdAt: true,
        },
      });

    console.log(
      "[BLOCKCHAIN] Sertifikat berhasil didaftarkan",
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
        "Sertifikat berhasil diupload dan hash berhasil dicatat ke blockchain.",

      data: {
        ...certificate,

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
      "[ERROR] uploadCertificate:",
      error,
    );

    if (req.file?.path) {
      await fs
        .unlink(
          req.file.path,
        )
        .catch(() => {});
    }

    res.status(500).json({
      success: false,

      message:
        "Gagal mengupload sertifikat atau mencatat hash ke blockchain.",
    });
  }
}

/**
 * =========================================================
 * SETUJUI SERTIFIKAT
 * =========================================================
 *
 * KEPALA SEKOLAH
 *
 * PATCH /api/certificates/:id/approve
 */
export async function approveCertificate(
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
          "Hanya Kepala Sekolah yang dapat menyetujui sertifikat.",
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
          "ID sertifikat tidak valid.",
      });

      return;
    }

    const certificate =
      await prisma.certificate.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          documentNumber: true,
          status: true,
        },
      });

    if (!certificate) {
      res.status(404).json({
        success: false,

        message:
          "Sertifikat tidak ditemukan.",
      });

      return;
    }

    if (
      certificate.status ===
      "APPROVED"
    ) {
      res.status(400).json({
        success: false,

        message:
          "Sertifikat sudah disetujui sebelumnya.",
      });

      return;
    }

    if (
      certificate.status ===
      "REJECTED"
    ) {
      res.status(400).json({
        success: false,

        message:
          "Sertifikat yang sudah ditolak tidak dapat disetujui.",
      });

      return;
    }

    const updatedCertificate =
      await prisma.certificate.update({
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
          documentType: true,
          status: true,
          issuedAt: true,
          createdAt: true,
        },
      });

    console.log(
      "[APPROVAL] Sertifikat disetujui:",
      updatedCertificate
        .documentNumber,
    );

    res.status(200).json({
      success: true,

      message:
        "Sertifikat berhasil disetujui dan diterbitkan.",

      data:
        updatedCertificate,
    });
  } catch (error) {
    console.error(
      "[ERROR] approveCertificate:",
      error,
    );

    res.status(500).json({
      success: false,

      message:
        "Gagal menyetujui sertifikat.",
    });
  }
}

/**
 * =========================================================
 * TOLAK SERTIFIKAT
 * =========================================================
 *
 * KEPALA SEKOLAH
 *
 * PATCH /api/certificates/:id/reject
 */
export async function rejectCertificate(
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
          "Hanya Kepala Sekolah yang dapat menolak sertifikat.",
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
          "ID sertifikat tidak valid.",
      });

      return;
    }

    const certificate =
      await prisma.certificate.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          documentNumber: true,
          status: true,
        },
      });

    if (!certificate) {
      res.status(404).json({
        success: false,

        message:
          "Sertifikat tidak ditemukan.",
      });

      return;
    }

    if (
      certificate.status ===
      "APPROVED"
    ) {
      res.status(400).json({
        success: false,

        message:
          "Sertifikat yang sudah diterbitkan tidak dapat ditolak.",
      });

      return;
    }

    if (
      certificate.status ===
      "REJECTED"
    ) {
      res.status(400).json({
        success: false,

        message:
          "Sertifikat sudah ditolak sebelumnya.",
      });

      return;
    }

    const updatedCertificate =
      await prisma.certificate.update({
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
          documentType: true,
          status: true,
          issuedAt: true,
          createdAt: true,
        },
      });

    console.log(
      "[REJECT] Sertifikat ditolak:",
      updatedCertificate
        .documentNumber,
    );

    res.status(200).json({
      success: true,

      message:
        "Sertifikat berhasil ditolak.",

      data:
        updatedCertificate,
    });
  } catch (error) {
    console.error(
      "[ERROR] rejectCertificate:",
      error,
    );

    res.status(500).json({
      success: false,

      message:
        "Gagal menolak sertifikat.",
    });
  }
}