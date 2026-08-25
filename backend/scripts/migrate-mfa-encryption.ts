import { prisma } from "./src/config/prisma.js";

import {
  encryptSensitiveData,
  isEncrypted,
} from "./src/services/encryption.service.js";

async function main() {
  const users =
    await prisma.user.findMany({
      where: {
        mfaSecret: {
          not: null,
        },
      },

      select: {
        id: true,
        mfaSecret: true,
      },
    });

  let migrated = 0;
  let alreadyEncrypted = 0;

  for (const user of users) {
    if (!user.mfaSecret) {
      continue;
    }

    if (
      isEncrypted(
        user.mfaSecret,
      )
    ) {
      alreadyEncrypted++;
      continue;
    }

    const encryptedSecret =
      encryptSensitiveData(
        user.mfaSecret,
      );

    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        mfaSecret:
          encryptedSecret,
      },
    });

    migrated++;
  }

  console.log({
    mfaSecretsFound:
      users.length,

    migrated,

    alreadyEncrypted,
  });
}

main()
  .catch((error) => {
    console.error(
      "MFA encryption migration gagal:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
