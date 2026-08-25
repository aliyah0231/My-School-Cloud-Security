import {
  Router,
} from "express";

import {
  login,
  me,
  logout,
  setupMfa,
  enableMfa,
  getMfaStatus,
} from "../controllers/auth.controller.js";

import {
  requireAuth,
} from "../middleware/auth.middleware.js";

import {
  loginRateLimiter,
} from "../middleware/rate-limit.middleware.js";


const router =
  Router();


/**
 * Login.
 */
router.post(
  "/login",
  loginRateLimiter,
  login,
);


/**
 * Data user yang sedang login.
 */
router.get(
  "/me",
  requireAuth,
  me,
);


/**
 * Setup Google Authenticator.
 */
router.post(
  "/mfa/setup",
  requireAuth,
  setupMfa,
);


/**
 * Verifikasi kode dan aktifkan MFA.
 */
router.post(
  "/mfa/enable",
  requireAuth,
  enableMfa,
);


/**
 * Melihat status MFA.
 */
router.get(
  "/mfa/status",
  requireAuth,
  getMfaStatus,
);


/**
 * Logout.
 */
router.post(
  "/logout",
  requireAuth,
  logout,
);


export default router;