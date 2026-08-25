import fs from "node:fs/promises";


const VAULT_TOKEN_FILE =
  "/run/secrets/vault_token";

const VAULT_ADDR =
  process.env.VAULT_ADDR ??
  "http://vault:8200";

const VAULT_SECRET_PATH =
  process.env.VAULT_SECRET_PATH ??
  "secret/data/my-school";


type VaultSecretResponse = {
  data?: {
    data?: {
      JWT_SECRET?: string;
      COOKIE_SECRET?: string;
      BLOCKCHAIN_PRIVATE_KEY?: string;
      DUDI_SIGNER_PRIVATE_KEY?: string;
      DATA_ENCRYPTION_KEY?: string;
    };
  };
};


/**
 * =========================================================
 * READ VAULT TOKEN
 * =========================================================
 */

async function readVaultToken():
Promise<string> {
  const token =
    await fs.readFile(
      VAULT_TOKEN_FILE,
      "utf8",
    );

  const cleanToken =
    token.trim();

  if (!cleanToken) {
    throw new Error(
      "Vault token tidak tersedia.",
    );
  }

  return cleanToken;
}


/**
 * =========================================================
 * LOAD APPLICATION SECRETS
 * =========================================================
 */

async function loadSecretsFromVault():
Promise<void> {
  const token =
    await readVaultToken();

  const response =
    await fetch(
      `${VAULT_ADDR}/v1/${VAULT_SECRET_PATH}`,
      {
        method: "GET",

        headers: {
          "X-Vault-Token":
            token,
        },
      },
    );

  if (!response.ok) {
    throw new Error(
      `Vault gagal mengembalikan secret. HTTP ${response.status}`,
    );
  }

  const result =
    (await response.json()) as
      VaultSecretResponse;

  const secrets =
    result.data?.data;

  if (!secrets) {
    throw new Error(
      "Secret My-School tidak ditemukan pada Vault.",
    );
  }


  const requiredSecrets = [
    "JWT_SECRET",
    "COOKIE_SECRET",
    "BLOCKCHAIN_PRIVATE_KEY",
    "DUDI_SIGNER_PRIVATE_KEY",
    "DATA_ENCRYPTION_KEY",
  ] as const;


  for (
    const secretName of
      requiredSecrets
  ) {
    const value =
      secrets[
        secretName
      ];

    if (
      !value ||
      !value.trim()
    ) {
      throw new Error(
        `Secret ${secretName} tidak tersedia pada Vault.`,
      );
    }

    /*
     * Secret hanya dimasukkan
     * ke memory process backend.
     *
     * Tidak dicetak ke log.
     */
    process.env[
      secretName
    ] = value;
  }


  console.log(
    "[VAULT] Secret My-School berhasil dimuat.",
  );

  console.log(
    "[VAULT] 5 secret tersedia untuk backend.",
  );
}


/**
 * =========================================================
 * BOOTSTRAP
 * =========================================================
 */

async function bootstrap():
Promise<void> {
  try {
    await loadSecretsFromVault();

    /*
     * Server baru di-import
     * SETELAH secret masuk
     * ke process.env.
     *
     * env.ts kemudian dapat
     * memvalidasinya seperti biasa.
     */
    await import(
      "./server.js"
    );
  } catch (error) {
    console.error(
      "[BOOTSTRAP] Backend gagal dijalankan:",
      error instanceof Error
        ? error.message
        : "Unknown error",
    );

    process.exit(1);
  }
}


void bootstrap();