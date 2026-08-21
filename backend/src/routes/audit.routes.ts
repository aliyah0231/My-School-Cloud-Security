import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  getAuditLogs,
);

export default router;