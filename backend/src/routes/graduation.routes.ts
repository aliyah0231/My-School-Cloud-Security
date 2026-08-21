import { Router } from "express";
import { getMyGraduation } from "../controllers/graduation.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/me",
  requireAuth,
  getMyGraduation,
);

export default router;
