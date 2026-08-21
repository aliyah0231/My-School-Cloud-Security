import { Router } from "express";
import {
  getMyTranscript,
  getAllTranscripts,
} from "../controllers/transcript.controller.js";
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";
import type { Response, NextFunction } from "express";

const router = Router();

// SISWA melihat transkrip miliknya sendiri
router.get(
  "/me",
  requireAuth,
  getMyTranscript,
);

// Jika frontend masih memanggil /api/transcripts,
// SISWA tetap diarahkan ke transkrip miliknya sendiri.
router.get(
  "/",
  requireAuth,
  (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (req.user?.role === "SISWA") {
      return getMyTranscript(req, res);
    }

    return requireRole(
      "STAF_TU",
      "GURU",
      "KEPALA_SEKOLAH",
    )(req, res, next);
  },
  getAllTranscripts,
);

export default router;