import { Router } from "express";
import {
  login,
  me,
  logout,
} from "../controllers/auth.controller.js";
import {
  requireAuth,
} from "../middleware/auth.middleware.js";
import {
  loginRateLimiter,
} from "../middleware/rate-limit.middleware.js";

const router = Router();

router.post(
  "/login",
  loginRateLimiter,
  login,
);

router.get(
  "/me",
  requireAuth,
  me,
);

router.post(
  "/logout",
  requireAuth,
  logout,
);

export default router;