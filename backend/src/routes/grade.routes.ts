import { Router } from "express";
import {
  getMyGrades,
  getAllGrades,
} from "../controllers/grade.controller.js";
import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth.middleware.js";
import type { Response, NextFunction } from "express";

const router = Router();

// SISWA mengambil nilai miliknya sendiri
router.get(
  "/me",
  requireAuth,
  getMyGrades,
);

// Route daftar nilai
router.get(
  "/",
  requireAuth,
  (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    // Jika SISWA, hanya berikan nilai miliknya sendiri
    if (req.user?.role === "SISWA") {
      return getMyGrades(req, res);
    }

    // Role lain diperiksa permission-nya
    return requireRole(
      "STAF_TU",
      "GURU",
      "KEPALA_SEKOLAH",
    )(req, res, next);
  },
  getAllGrades,
);

export default router;