import { Router } from "express";
import {
  verifyDocument,
} from "../controllers/verification.controller.js";

const router = Router();

router.post(
  "/document",
  verifyDocument,
);

export default router;