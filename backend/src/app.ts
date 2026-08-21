import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import rbacTestRoutes from "./routes/rbac-test.routes.js";
import studentRoutes from "./routes/student.routes.js";
import gradeRoutes from "./routes/grade.routes.js";
import transcriptRoutes from "./routes/transcript.routes.js";
import graduationRoutes from "./routes/graduation.routes.js";
import diplomaRoutes from "./routes/diploma.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import verificationRoutes from "./routes/verification.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import subjectRoutes from "./routes/subject.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

/**
 * Aplikasi berada di belakang satu reverse proxy Nginx.
 * Diperlukan agar express-rate-limit membaca IP client dengan benar.
 */
app.set("trust proxy", 1);


app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "same-site",
    },
  }),
);

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend berjalan.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/transcripts", transcriptRoutes);
app.use("/api/graduations", graduationRoutes);
app.use("/api/diplomas", diplomaRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/rbac-test", rbacTestRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan.",
  });
});

app.use(errorHandler);

export default app;