import {
  Router,
} from "express";

import {
  getMyGrades,
  getAllGrades,
  updateGradeWithBlockchainAudit,
} from "../controllers/grade.controller.js";

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
 * SISWA MELIHAT NILAI SENDIRI
 * =========================================================
 */
router.get(
  "/me",
  requireAuth,
  getMyGrades,
);


/*
 * =========================================================
 * DAFTAR NILAI
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
      return getMyGrades(
        req,
        res,
      );
    }


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

  getAllGrades,
);


/*
 * =========================================================
 * UPDATE NILAI + BLOCKCHAIN AUDIT
 * =========================================================
 *
 * GURU:
 * hanya nilai yang menjadi tanggung jawabnya.
 *
 * STAF_TU / KEPALA_SEKOLAH:
 * dapat melakukan update sesuai role.
 */
router.put(
  "/:gradeId",

  requireAuth,

  requireRole(
    "GURU",
    "STAF_TU",
    "KEPALA_SEKOLAH",
  ),

  updateGradeWithBlockchainAudit,
);


export default router;