import {
  ethers,
} from "ethers";

import {
  env,
} from "../config/env.js";


/*
 * =========================================================
 * WALLET DIGITAL DUDI
 * =========================================================
 *
 * Wallet ini TIDAK sama dengan wallet registrar blockchain.
 *
 * Registrar blockchain:
 * mendaftarkan hash dokumen ke smart contract.
 *
 * Wallet DUDI:
 * menandatangani hash Sertifikat PKL.
 */
const dudiWallet =
  new ethers.Wallet(
    env.DUDI_SIGNER_PRIVATE_KEY,
  );


function normalizeSha256Hash(
  hash: string,
): string {
  const cleanHash =
    hash.startsWith("0x")
      ? hash.slice(2)
      : hash;


  if (
    !/^[a-fA-F0-9]{64}$/.test(
      cleanHash,
    )
  ) {
    throw new Error(
      "Hash sertifikat harus berupa SHA-256 64 karakter hexadecimal.",
    );
  }


  return cleanHash.toLowerCase();
}


/*
 * =========================================================
 * MEMBENTUK PESAN SIGNATURE
 * =========================================================
 *
 * Domain prefix digunakan supaya signature ini
 * khusus untuk Sertifikat PKL My-School.
 */
function buildSigningMessage(
  fileHash: string,
): string {
  const normalizedHash =
    normalizeSha256Hash(
      fileHash,
    );


  return (
    "MY-SCHOOL:DUDI_CERTIFICATE:" +
    normalizedHash
  );
}


/*
 * =========================================================
 * SIGN HASH SERTIFIKAT
 * =========================================================
 */
export async function signCertificateByDudi(
  fileHash: string,
) {
  const normalizedHash =
    normalizeSha256Hash(
      fileHash,
    );


  const message =
    buildSigningMessage(
      normalizedHash,
    );


  const signature =
    await dudiWallet.signMessage(
      message,
    );


  return {
    signedHash:
      normalizedHash,

    signature,

    walletAddress:
      dudiWallet.address,
  };
}


/*
 * =========================================================
 * VERIFIKASI DIGITAL SIGNATURE
 * =========================================================
 */
export function verifyDudiCertificateSignature(
  fileHash: string,
  signature: string,
  expectedWalletAddress: string,
) {
  try {
    const normalizedHash =
      normalizeSha256Hash(
        fileHash,
      );


    const message =
      buildSigningMessage(
        normalizedHash,
      );


    const recoveredAddress =
      ethers.verifyMessage(
        message,
        signature,
      );


    const valid =
      recoveredAddress.toLowerCase() ===
      expectedWalletAddress.toLowerCase();


    return {
      valid,

      recoveredAddress,

      expectedWalletAddress,
    };

  } catch {
    return {
      valid:
        false,

      recoveredAddress:
        null,

      expectedWalletAddress,
    };
  }
}


/*
 * =========================================================
 * AMBIL PUBLIC WALLET ADDRESS
 * =========================================================
 *
 * Aman ditampilkan.
 * Private key tidak pernah dikembalikan.
 */
export function getDudiWalletAddress(): string {
  return dudiWallet.address;
}