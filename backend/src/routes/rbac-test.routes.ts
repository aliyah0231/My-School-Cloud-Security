import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/rbac.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

const router = Router();

router.get(
  "/student-data",
  requireAuth,
  requirePermission(PERMISSIONS.STUDENTS_READ),
  (_req, res) => {
    res.json({
      success: true,
      message: "Kamu memiliki permission students:read.",
    });
  },
);

router.get(
  "/own-grades",
  requireAuth,
  requirePermission(PERMISSIONS.GRADES_READ_OWN),
  (_req, res) => {
    res.json({
      success: true,
      message: "Kamu memiliki permission grades:read:own.",
    });
  },
);

export default router;