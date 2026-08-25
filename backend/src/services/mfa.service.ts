import {
  generateSecret,
  generateURI,
  verify,
} from "otplib";

import QRCode from "qrcode";

const APP_NAME = "My-School Cloud Security";

/**
 * Membuat secret baru untuk Google Authenticator.
 */
export function generateMfaSecret(): string {
  return generateSecret();
}

/**
 * Membuat URI otpauth://
 * yang dapat dibaca Google Authenticator.
 */
export function generateMfaUri(
  username: string,
  secret: string,
): string {
  return generateURI({
    issuer: APP_NAME,
    label: username,
    secret,
  });
}

/**
 * Membuat QR Code dalam format Data URL.
 */
export async function generateMfaQrCode(
  username: string,
  secret: string,
): Promise<string> {
  const uri = generateMfaUri(
    username,
    secret,
  );

  return QRCode.toDataURL(uri);
}

/**
 * Memverifikasi kode OTP 6 digit
 * dari Google Authenticator.
 */
export async function verifyMfaToken(
  token: string,
  secret: string,
): Promise<boolean> {
  try {
    const result = await verify({
      token,
      secret,
    });

    return result.valid;
  } catch {
    return false;
  }
}