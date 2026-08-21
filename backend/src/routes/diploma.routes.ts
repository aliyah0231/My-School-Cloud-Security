import { Router } from "express";

import {
  getMyDiplomas,
  getAllDiplomas,
  uploadDiploma,
  getDiplomaFile,
  approveDiploma,
rejectDiploma,
} from "../controllers/diploma.controller.js";

import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  uploadDocument,
} from "../middleware/upload.middleware.js";

import type {
  Response,
  NextFunction,
} from "express";

const router = Router();

/**
 * =========================================================
 * UPLOAD IJAZAH
 * =========================================================
 *
 * STAF TU
 */
router.post(
  "/upload",
  requireAuth,
  requireRole("STAF_TU"),
  uploadDocument.single(
    "diploma",
  ),
  uploadDiploma,
);

/**
 * =========================================================
 * IJAZAH SISWA SENDIRI
 * =========================================================
 */
router.get(
  "/me",
  requireAuth,
  getMyDiplomas,
);

/**
 * =========================================================
 * PERSETUJUAN IJAZAH
 * =========================================================
 *
 * KEPALA SEKOLAH
 *
 * PATCH /api/diplomas/:id/approve
 */
router.patch(
  "/:id/approve",
  requireAuth,
  requireRole(
    "KEPALA_SEKOLAH",
  ),
  approveDiploma,
);

router.patch(
  "/:id/reject",
  requireAuth,
  requireRole(
    "KEPALA_SEKOLAH",
  ),
  rejectDiploma,
);

/**
 * =========================================================
 * FILE IJAZAH
 * =========================================================
 */
router.get(
  "/:id/file",
  requireAuth,
  getDiplomaFile,
);

/**
 * =========================================================
 * DAFTAR IJAZAH
 * =========================================================
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
      return getMyDiplomas(
        req,
        res,
      );
    }

    return requireRole(
      "STAF_TU",
      "KEPALA_SEKOLAH",
      "ADMIN",
    )(
      req,
      res,
      next,
    );
  },

  getAllDiplomas,
);

export default router;