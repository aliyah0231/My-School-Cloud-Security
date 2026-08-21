import { Router } from "express";

import {
  getAllCertificates,
  getMyCertificates,
  uploadCertificate,
  approveCertificate,
  rejectCertificate,
} from "../controllers/certificate.controller.js";

import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import type {
  Response,
  NextFunction,
} from "express";

import {
  uploadDocument,
} from "../middleware/upload.middleware.js";

const router = Router();

/**
 * =========================================================
 * UPLOAD SERTIFIKAT PKL / MAGANG
 * =========================================================
 *
 * Hanya STAF TU.
 *
 * POST /api/certificates/upload
 */
router.post(
  "/upload",
  requireAuth,
  requireRole("STAF_TU"),
  uploadDocument.single("certificate"),
  uploadCertificate,
);

/**
 * =========================================================
 * SISWA MELIHAT SERTIFIKAT MILIKNYA SENDIRI
 * =========================================================
 *
 * GET /api/certificates/me
 */
router.get(
  "/me",
  requireAuth,
  getMyCertificates,
);

/**
 * =========================================================
 * SETUJUI SERTIFIKAT
 * =========================================================
 *
 * Hanya KEPALA SEKOLAH.
 *
 * PATCH /api/certificates/:id/approve
 */
router.patch(
  "/:id/approve",
  requireAuth,
  requireRole("KEPALA_SEKOLAH"),
  approveCertificate,
);

/**
 * =========================================================
 * TOLAK SERTIFIKAT
 * =========================================================
 *
 * Hanya KEPALA SEKOLAH.
 *
 * PATCH /api/certificates/:id/reject
 */
router.patch(
  "/:id/reject",
  requireAuth,
  requireRole("KEPALA_SEKOLAH"),
  rejectCertificate,
);

/**
 * =========================================================
 * DAFTAR SERTIFIKAT
 * =========================================================
 *
 * SISWA:
 * diarahkan ke getMyCertificates()
 *
 * Role lain:
 * melihat seluruh data sesuai permission.
 *
 * GET /api/certificates
 */
router.get(
  "/",
  requireAuth,
  (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (
      req.user?.role ===
      "SISWA"
    ) {
      return getMyCertificates(
        req,
        res,
      );
    }

    return requireRole(
      "STAF_TU",
      "KEPALA_SEKOLAH",
      "MITRA_INDUSTRI",
      "ADMIN",
    )(
      req,
      res,
      next,
    );
  },
  getAllCertificates,
);

export default router;