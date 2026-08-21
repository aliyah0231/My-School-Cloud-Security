import { expect } from "chai";
import { ethers } from "hardhat";

describe("DocumentRegistry", function () {
  it("harus bisa mendaftarkan dokumen", async function () {
    const DocumentRegistry =
      await ethers.getContractFactory("DocumentRegistry");

    const registry =
      await DocumentRegistry.deploy();

    await registry.waitForDeployment();

    const verificationCode = "CERT-PKL-001";
    const documentType = "CERTIFICATE";

    const documentHash = ethers.keccak256(
      ethers.toUtf8Bytes("dokumen-pkl-siswa-001"),
    );

    await registry.registerDocument(
      verificationCode,
      documentType,
      documentHash,
    );

    const result =
      await registry.getDocument(verificationCode);

    expect(result[0]).to.equal(verificationCode);
    expect(result[1]).to.equal(documentType);
    expect(result[2]).to.equal(documentHash);
    expect(result[4]).to.equal(true);
  });

  it("harus bisa memverifikasi dokumen yang valid", async function () {
    const DocumentRegistry =
      await ethers.getContractFactory("DocumentRegistry");

    const registry =
      await DocumentRegistry.deploy();

    await registry.waitForDeployment();

    const verificationCode = "DIP-001";
    const documentType = "DIPLOMA";

    const documentHash = ethers.keccak256(
      ethers.toUtf8Bytes("ijazah-siswa-001"),
    );

    await registry.registerDocument(
      verificationCode,
      documentType,
      documentHash,
    );

    const result =
      await registry.verifyDocument(
        verificationCode,
        documentHash,
      );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(documentType);
  });

  it("harus menolak hash dokumen yang berbeda", async function () {
    const DocumentRegistry =
      await ethers.getContractFactory("DocumentRegistry");

    const registry =
      await DocumentRegistry.deploy();

    await registry.waitForDeployment();

    const verificationCode = "CERT-002";

    const originalHash = ethers.keccak256(
      ethers.toUtf8Bytes("dokumen-asli"),
    );

    const wrongHash = ethers.keccak256(
      ethers.toUtf8Bytes("dokumen-palsu"),
    );

    await registry.registerDocument(
      verificationCode,
      "CERTIFICATE",
      originalHash,
    );

    const result =
      await registry.verifyDocument(
        verificationCode,
        wrongHash,
      );

    expect(result[0]).to.equal(false);
  });
});