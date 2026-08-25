import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum([
      "development",
      "test",
      "production",
    ])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(4000),

  DATABASE_URL: z
    .string()
    .min(1),

  JWT_SECRET: z
    .string()
    .min(32),

  JWT_EXPIRES_IN: z
    .string()
    .default("15m"),

  COOKIE_SECRET: z
    .string()
    .min(32),

  FRONTEND_URL: z
    .string()
    .url()
    .default(
      "http://localhost:3000",
    ),

  MAX_FILE_SIZE_MB: z.coerce
    .number()
    .positive()
    .default(10),

  BLOCKCHAIN_RPC_URL: z
    .string()
    .url()
    .default(
      "http://127.0.0.1:8545",
    ),

  BLOCKCHAIN_CONTRACT_ADDRESS: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
    ),

  BLOCKCHAIN_PRIVATE_KEY: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{64}$/,
    ),

  DUDI_SIGNER_PRIVATE_KEY: z
    .string()
    .regex(
      /^0x[a-fA-F0-9]{64}$/,
      "DUDI_SIGNER_PRIVATE_KEY harus berupa private key Ethereum 32-byte.",
    ),

  DATA_ENCRYPTION_KEY: z
    .string()
    .regex(
      /^[a-fA-F0-9]{64}$/,
      "DATA_ENCRYPTION_KEY harus berupa 64 karakter hexadecimal.",
    ),
});

export const env =
  envSchema.parse(
    process.env,
  );