import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthTokenPayload {
  userId: string;
  role: string;
}

export function createAccessToken(
  payload: AuthTokenPayload,
): string {
  const expiresIn =
    env.JWT_EXPIRES_IN || "15m";

  return jwt.sign(
    payload,
    env.JWT_SECRET,
    {
      expiresIn: expiresIn as jwt.SignOptions["expiresIn"] & {},
      issuer: "smk-administrasi",
      audience: "smk-administrasi-client",
    },
  );
}

export function verifyAccessToken(
  token: string,
): AuthTokenPayload {
  const payload = jwt.verify(
    token,
    env.JWT_SECRET,
    {
      issuer: "smk-administrasi",
      audience: "smk-administrasi-client",
    },
  );

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.userId !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: payload.userId,
    role: payload.role,
  };
}