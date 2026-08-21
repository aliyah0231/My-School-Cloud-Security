import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  console.error("[ERROR]", error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Data yang dikirim tidak valid.",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  return res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server.",
  });
};