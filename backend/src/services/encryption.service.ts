import crypto from "node:crypto";

import {
  env,
} from "../config/env.js";

const ALGORITHM =
  "aes-256-gcm";

const FORMAT_PREFIX =
  "enc:v1";

const IV_LENGTH =
  12;

const AUTH_TAG_LENGTH =
  16;


/**
 * =========================================================
 * ENCRYPTION KEY
 * =========================================================
 */

function getEncryptionKey(): Buffer {
  const key =
    Buffer.from(
      env.DATA_ENCRYPTION_KEY,
      "hex",
    );

  if (key.length !== 32) {
    throw new Error(
      "DATA_ENCRYPTION_KEY harus berukuran 32 byte untuk AES-256.",
    );
  }

  return key;
}


/**
 * =========================================================
 * DETEKSI DATA TERENKRIPSI
 * =========================================================
 */

export function isEncrypted(
  value: string,
): boolean {
  return value.startsWith(
    `${FORMAT_PREFIX}:`,
  );
}


/**
 * =========================================================
 * AES-256-GCM ENCRYPT
 * =========================================================
 */

export function encryptSensitiveData(
  plainText: string,
): string {
  if (!plainText) {
    throw new Error(
      "Data yang akan dienkripsi tidak boleh kosong.",
    );
  }

  /*
   * Hindari double encryption.
   */
  if (
    isEncrypted(
      plainText,
    )
  ) {
    return plainText;
  }

  const key =
    getEncryptionKey();

  const iv =
    crypto.randomBytes(
      IV_LENGTH,
    );

  const cipher =
    crypto.createCipheriv(
      ALGORITHM,
      key,
      iv,
      {
        authTagLength:
          AUTH_TAG_LENGTH,
      },
    );

  const encrypted =
    Buffer.concat([
      cipher.update(
        plainText,
        "utf8",
      ),

      cipher.final(),
    ]);

  const authTag =
    cipher.getAuthTag();

  return [
    FORMAT_PREFIX,

    iv.toString(
      "base64",
    ),

    authTag.toString(
      "base64",
    ),

    encrypted.toString(
      "base64",
    ),
  ].join(":");
}


/**
 * =========================================================
 * AES-256-GCM DECRYPT
 * =========================================================
 */

export function decryptSensitiveData(
  encryptedValue: string,
): string {
  if (!encryptedValue) {
    throw new Error(
      "Data terenkripsi tidak tersedia.",
    );
  }

  /*
   * BACKWARD COMPATIBILITY:
   *
   * Data lama yang belum terenkripsi
   * dikembalikan apa adanya.
   *
   * Dengan cara ini MFA lama tidak
   * langsung rusak ketika AES diterapkan.
   */
  if (
    !isEncrypted(
      encryptedValue,
    )
  ) {
    return encryptedValue;
  }


  const parts =
  encryptedValue.split(
    ":",
  );

if (
  parts.length !== 5 ||
  parts[0] !== "enc" ||
  parts[1] !== "v1"
) {
  throw new Error(
    "Format data terenkripsi tidak valid.",
  );
}

const ivBase64 =
  parts[2];

const authTagBase64 =
  parts[3];

const encryptedBase64 =
  parts[4];

if (
  !ivBase64 ||
  !authTagBase64 ||
  !encryptedBase64
) {
  throw new Error(
    "Komponen data terenkripsi tidak lengkap.",
  );
}

const iv =
  Buffer.from(
    ivBase64,
    "base64",
  );

const authTag =
  Buffer.from(
    authTagBase64,
    "base64",
  );

const encrypted =
  Buffer.from(
    encryptedBase64,
    "base64",
  );

  const key =
    getEncryptionKey();

  const decipher =
    crypto.createDecipheriv(
      ALGORITHM,
      key,
      iv,
      {
        authTagLength:
          AUTH_TAG_LENGTH,
      },
    );

  decipher.setAuthTag(
    authTag,
  );

  const decrypted =
    Buffer.concat([
      decipher.update(
        encrypted,
      ),

      decipher.final(),
    ]);

  return decrypted.toString(
    "utf8",
  );
}