import {
  Router,
} from "express";

import {
  getMyTranscript,
  getAllTranscripts,
  registerTranscriptBlockchain,
  verifyTranscriptBlockchain,
} from "../controllers/transcript.controller.js";

import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import type {
  Response,
  NextFunction,
} from "express";

const router =
  Router();


/*
 * =========================================================
 * SISWA MELIHAT TRANSKRIP SENDIRI
 * =========================================================
 */
router.get(
  "/me",
  requireAuth,
  getMyTranscript,
);


/*
 * =========================================================
 * DAFTAR TRANSKRIP
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

    /*
     * SISWA hanya boleh melihat
     * transkrip miliknya sendiri.
     */
    if (
      req.user?.role ===
      "SISWA"
    ) {
      return getMyTranscript(
        req,
        res,
      );
    }


    /*
     * Role administratif/guru
     * dapat melihat seluruh transkrip.
     */
    return requireRole(
      "STAF_TU",
      "GURU",
      "KEPALA_SEKOLAH",
    )(
      req,
      res,
      next,
    );
  },

  getAllTranscripts,
);


/*
 * =========================================================
 * REGISTER TRANSKRIP KE BLOCKCHAIN
 * =========================================================
 *
 * POST:
 * /api/transcripts/:studentId/blockchain
 *
 * Hanya Staf TU dan Kepala Sekolah
 * yang boleh melakukan registrasi.
 */
router.post(
  "/:studentId/blockchain",

  requireAuth,

  requireRole(
    "STAF_TU",
    "KEPALA_SEKOLAH",
  ),

  registerTranscriptBlockchain,
);


/*
 * =========================================================
 * VERIFIKASI TRANSKRIP BLOCKCHAIN
 * =========================================================
 *
 * GET:
 * /api/transcripts/:studentId/blockchain/verify
 */
router.get(
  "/:studentId/blockchain/verify",

  requireAuth,

  verifyTranscriptBlockchain,
);


export default router;