import { Router } from "express";

import {
  getMyStudentProfile,
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/student.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/rbac.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

/**
 * =========================================================
 * PROFIL SISWA SENDIRI
 * =========================================================
 *
 * SISWA hanya boleh melihat profil miliknya sendiri.
 *
 * GET /api/students/me
 */
router.get(
  "/me",
  requireAuth,
  requirePermission(PERMISSIONS.PROFILE_READ_OWN),
  getMyStudentProfile,
);

/**
 * =========================================================
 * DATA SELURUH SISWA
 * =========================================================
 *
 * Membutuhkan permission:
 * students:read
 *
 * Role yang saat ini memiliki permission:
 * - GURU
 * - STAF_TU
 * - KEPALA_SEKOLAH
 *
 * GET /api/students
 */
router.get(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.STUDENTS_READ),
  listStudents,
);

/**
 * =========================================================
 * DETAIL SISWA
 * =========================================================
 *
 * Membutuhkan permission:
 * students:read
 *
 * GET /api/students/:id
 */
router.get(
  "/:id",
  requireAuth,
  requirePermission(PERMISSIONS.STUDENTS_READ),
  getStudentById,
);

/**
 * =========================================================
 * MEMBUAT DATA SISWA
 * =========================================================
 *
 * Membutuhkan permission:
 * students:create
 *
 * Saat ini:
 * - STAF_TU
 *
 * POST /api/students
 */
router.post(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.STUDENTS_CREATE),
  createStudent,
);

/**
 * =========================================================
 * UPDATE DATA SISWA
 * =========================================================
 *
 * Membutuhkan permission:
 * students:update
 *
 * Saat ini:
 * - STAF_TU
 *
 * PATCH /api/students/:id
 */
router.patch(
  "/:id",
  requireAuth,
  requirePermission(PERMISSIONS.STUDENTS_UPDATE),
  updateStudent,
);

/**
 * =========================================================
 * DELETE DATA SISWA
 * =========================================================
 *
 * Membutuhkan permission:
 * students:delete
 *
 * Saat ini:
 * - STAF_TU
 *
 * DELETE /api/students/:id
 */
router.delete(
  "/:id",
  requireAuth,
  requirePermission(PERMISSIONS.STUDENTS_DELETE),
  deleteStudent,
);

export default router;