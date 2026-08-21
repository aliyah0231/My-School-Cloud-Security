import { ethers } from "ethers";
import { env } from "../../config/env.js";

const CONTRACT_ABI = [
  "function registerDocument(string verificationCode,string documentType,bytes32 documentHash)",
  "function verifyDocument(string verificationCode,bytes32 submittedHash) view returns (bool valid,string documentType,uint256 registeredAt)",
  "function getDocument(string verificationCode) view returns (string verificationCode,string documentType,bytes32 documentHash,uint256 registeredAt,bool exists)",
];

const provider = new ethers.JsonRpcProvider(
  env.BLOCKCHAIN_RPC_URL,
);

const wallet = new ethers.Wallet(
  env.BLOCKCHAIN_PRIVATE_KEY,
  provider,
);

const contract = new ethers.Contract(
  env.BLOCKCHAIN_CONTRACT_ADDRESS,
  CONTRACT_ABI,
  wallet,
);

type RegisterDocumentResult = {
  transactionHash: string;
};

type VerifyDocumentResult = {
  valid: boolean;
  documentType: string;
  registeredAt: number;
};

type GetDocumentResult = {
  verificationCode: string;
  documentType: string;
  documentHash: string;
  registeredAt: number;
  exists: boolean;
};

/*
 * Mengubah SHA-256:
 *
 * fb8b00ad...
 *
 * menjadi format bytes32 Ethereum:
 *
 * 0xfb8b00ad...
 */
function normalizeSha256Hash(
  hash: string,
): string {
  const cleanHash = hash.startsWith("0x")
    ? hash.slice(2)
    : hash;

  if (!/^[a-fA-F0-9]{64}$/.test(cleanHash)) {
    throw new Error(
      "Hash SHA-256 harus terdiri dari 64 karakter hexadecimal.",
    );
  }

  return `0x${cleanHash}`;
}

/*
 * =====================================
 * REGISTER DOKUMEN KE BLOCKCHAIN
 * =====================================
 */
export async function registerDocumentOnBlockchain(
  verificationCode: string,
  documentType: string,
  documentHash: string,
): Promise<RegisterDocumentResult> {
  const documentHashBytes32 =
    normalizeSha256Hash(documentHash);

  const registerDocument =
    contract.getFunction(
      "registerDocument",
    );

  const tx = await registerDocument(
    verificationCode,
    documentType,
    documentHashBytes32,
  );

  const receipt = await tx.wait();

  if (!receipt) {
    throw new Error(
      "Transaksi blockchain tidak mendapatkan receipt.",
    );
  }

  return {
    transactionHash: receipt.hash,
  };
}

/*
 * =====================================
 * VERIFIKASI DOKUMEN DI BLOCKCHAIN
 * =====================================
 */
export async function verifyDocumentOnBlockchain(
  verificationCode: string,
  submittedHash: string,
): Promise<VerifyDocumentResult> {
  const submittedHashBytes32 =
    normalizeSha256Hash(submittedHash);

  const verifyDocument =
    contract.getFunction(
      "verifyDocument",
    );

  const result =
    await verifyDocument(
      verificationCode,
      submittedHashBytes32,
    );

  return {
    valid: Boolean(result[0]),
    documentType:
      String(result[1]),
    registeredAt:
      Number(result[2]),
  };
}

/*
 * =====================================
 * AMBIL DOKUMEN DARI BLOCKCHAIN
 * =====================================
 */
export async function getDocumentFromBlockchain(
  verificationCode: string,
): Promise<GetDocumentResult> {
  const getDocument =
    contract.getFunction(
      "getDocument",
    );

  const result =
    await getDocument(
      verificationCode,
    );

  return {
    verificationCode:
      String(result[0]),

    documentType:
      String(result[1]),

    documentHash:
      String(result[2]),

    registeredAt:
      Number(result[3]),

    exists:
      Boolean(result[4]),
  };
}