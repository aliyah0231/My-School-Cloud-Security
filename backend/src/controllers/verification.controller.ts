import type { Request, Response } from "express";
import crypto from "node:crypto";
import { prisma } from "../config/prisma.js";
import {
  verifyDocumentOnBlockchain,
} from "../services/blockchain/blockchain.service.js";

function isValidSha256Hash(hash: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(hash);
}

function compareHash(
  submittedHash: string,
  storedHash: string,
): boolean {
  if (
    !isValidSha256Hash(submittedHash) ||
    !isValidSha256Hash(storedHash)
  ) {
    return false;
  }

  const submittedBuffer = Buffer.from(
    submittedHash,
    "hex",
  );

  const storedBuffer = Buffer.from(
    storedHash,
    "hex",
  );

  if (
    submittedBuffer.length !==
    storedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    submittedBuffer,
    storedBuffer,
  );
}

export async function verifyDocument(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const {
      verificationCode,
      submittedHash,
    } = req.body;

    const ipAddress = req.ip;
    const userAgent =
      req.get("user-agent") ?? null;

    if (
      typeof verificationCode !== "string" ||
      !verificationCode.trim()
    ) {
      res.status(400).json({
        success: false,
        message:
          "Kode verifikasi wajib diisi.",
      });

      return;
    }

    if (
      typeof submittedHash !== "string" ||
      !isValidSha256Hash(submittedHash)
    ) {
      res.status(400).json({
        success: false,
        message:
          "Hash dokumen tidak valid.",
      });

      return;
    }

    const code =
      verificationCode.trim();

    const diploma =
      await prisma.diploma.findUnique({
        where: {
          verificationCode: code,
        },
        include: {
          student: {
            select: {
              studentNumber: true,
              fullName: true,
            },
          },
        },
      });

console.log(
  "[VERIFY] Diploma ditemukan:",
  diploma ? "YA" : "TIDAK",
);

if (diploma) {
  console.log(
    "[VERIFY] Kode database:",
    diploma.verificationCode,
  );
}

    if (diploma) {
     const blockchainResult =
  await verifyDocumentOnBlockchain(
    code,
    submittedHash,
  );

const isValid =
  blockchainResult.valid;
 console.log(
  "[VERIFY] Kode diterima:",
  JSON.stringify(code),
);

console.log(
  "[VERIFY] Panjang kode:",
  code.length,
);

      const status = isValid
        ? "VALID"
        : "FALSIFIED";

      await prisma.verificationRecord.create({
        data: {
          verificationCode: code,
          diplomaId: diploma.id,
          submittedHash,
          storedHash: diploma.fileHash,
          status,
          ipAddress:
            ipAddress ?? null,
          userAgent,
        },
      });

      res.status(200).json({
  success: true,
  data: {
    valid: isValid,
    status,
    documentType: "DIPLOMA",
    documentNumber:
      diploma.documentNumber,
    documentName:
      diploma.documentName,
    student: diploma.student,
    issuedAt:
      diploma.issuedAt,

    blockchain: {
      valid:
        blockchainResult.valid,
      documentType:
        blockchainResult.documentType,
      registeredAt:
        blockchainResult.registeredAt,
    },
  },
});
      return;
    }

    const certificate =
      await prisma.certificate.findUnique({
        where: {
          verificationCode: code,
        },
        include: {
          student: {
            select: {
              studentNumber: true,
              fullName: true,
            },
          },
        },
      });

    if (certificate) {
      const isValid = compareHash(
        submittedHash,
        certificate.fileHash,
      );

      const status = isValid
        ? "VALID"
        : "FALSIFIED";

      await prisma.verificationRecord.create({
        data: {
          verificationCode: code,
          certificateId:
            certificate.id,
          submittedHash,
          storedHash:
            certificate.fileHash,
          status,
          ipAddress:
            ipAddress ?? null,
          userAgent,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          valid: isValid,
          status,
          documentType:
            certificate.documentType,
          documentNumber:
            certificate.documentNumber,
          documentName:
            certificate.documentName,
          institutionName:
            certificate.institutionName,
          student:
            certificate.student,
          issuedAt:
            certificate.issuedAt,
        },
      });

      return;
    }

    res.status(404).json({
      success: false,
      message:
        "Dokumen tidak ditemukan.",
      data: {
        valid: false,
        status: "INVALID",
      },
    });
  } catch (error) {
    console.error(
      "[ERROR] verifyDocument:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Gagal melakukan verifikasi dokumen.",
    });
  }
}