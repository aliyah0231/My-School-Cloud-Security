import {
  Router,
} from "express";

import {
  getAllCertificates,
  getMyCertificates,
  uploadCertificate,
  approveCertificate,
  rejectCertificate,
  signCertificateDudi,
  verifyCertificateDudiSignature,
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


const router =
  Router();


/**
 * =========================================================
 * UPLOAD SERTIFIKAT PKL / MAGANG
 * =========================================================
 */
router.post(
  "/upload",

  requireAuth,

  requireRole(
    "STAF_TU",
  ),

  uploadDocument.single(
    "certificate",
  ),

  uploadCertificate,
);


/**
 * =========================================================
 * SERTIFIKAT SISWA SENDIRI
 * =========================================================
 */
router.get(
  "/me",

  requireAuth,

  getMyCertificates,
);


/**
 * =========================================================
 * DUDI DIGITAL SIGNATURE
 * =========================================================
 *
 * Hanya MITRA_INDUSTRI.
 */
router.post(
  "/:id/dudi-sign",

  requireAuth,

  requireRole(
    "MITRA_INDUSTRI",
  ),

  signCertificateDudi,
);


/**
 * =========================================================
 * VERIFIKASI DIGITAL SIGNATURE DUDI
 * =========================================================
 */
router.get(
  "/:id/dudi-signature/verify",

  requireAuth,

  verifyCertificateDudiSignature,
);


/**
 * =========================================================
 * APPROVE SERTIFIKAT
 * =========================================================
 */
router.patch(
  "/:id/approve",

  requireAuth,

  requireRole(
    "KEPALA_SEKOLAH",
  ),

  approveCertificate,
);


/**
 * =========================================================
 * REJECT SERTIFIKAT
 * =========================================================
 */
router.patch(
  "/:id/reject",

  requireAuth,

  requireRole(
    "KEPALA_SEKOLAH",
  ),

  rejectCertificate,
);


/**
 * =========================================================
 * DAFTAR SERTIFIKAT
 * =========================================================
 */
router.get(
  "/",

  requireAuth,

  (
    req:
      AuthenticatedRequest,

    res:
      Response,

    next:
      NextFunction,
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
    )(
      req,
      res,
      next,
    );
  },

  getAllCertificates,
);


export default router;