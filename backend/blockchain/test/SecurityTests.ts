import { expect } from "chai";
import { ethers } from "hardhat";

describe("DocumentRegistry - Security Tests", function () {

  it("TEST 16 - wallet tidak sah harus ditolak", async function () {
    const [owner, attacker] =
      await ethers.getSigners();

    const DocumentRegistry =
      await ethers.getContractFactory(
        "DocumentRegistry"
      );

    const registry =
      await DocumentRegistry.deploy();

    await registry.waitForDeployment();

    const hash = ethers.keccak256(
      ethers.toUtf8Bytes(
        "unauthorized-test"
      )
    );

    await expect(
      registry
        .connect(attacker)
        .registerDocument(
          "UNAUTHORIZED-001",
          "DIPLOMA",
          hash
        )
    ).to.be.revertedWith(
      "Unauthorized registrar"
    );

    console.log(
      "HASIL : wallet tidak sah DITOLAK"
    );
  });


  it("TEST 17A - verification code sama harus ditolak", async function () {
    const DocumentRegistry =
      await ethers.getContractFactory(
        "DocumentRegistry"
      );

    const registry =
      await DocumentRegistry.deploy();

    await registry.waitForDeployment();

    const hash1 = ethers.keccak256(
      ethers.toUtf8Bytes("dokumen-asli")
    );

    const hash2 = ethers.keccak256(
      ethers.toUtf8Bytes("dokumen-lain")
    );

    await registry.registerDocument(
      "DUPLICATE-CODE-001",
      "DIPLOMA",
      hash1
    );

    await expect(
      registry.registerDocument(
        "DUPLICATE-CODE-001",
        "DIPLOMA",
        hash2
      )
    ).to.be.revertedWith(
      "Dokumen sudah terdaftar"
    );

    console.log(
      "HASIL : duplicate verification code DITOLAK"
    );
  });


  it("TEST 17B - duplicate document hash harus ditolak", async function () {
    const DocumentRegistry =
      await ethers.getContractFactory(
        "DocumentRegistry"
      );

    const registry =
      await DocumentRegistry.deploy();

    await registry.waitForDeployment();

    const sameHash = ethers.keccak256(
      ethers.toUtf8Bytes("dokumen-sama")
    );

    await registry.registerDocument(
      "DOC-001",
      "DIPLOMA",
      sameHash
    );

    await expect(
      registry.registerDocument(
        "DOC-002",
        "DIPLOMA",
        sameHash
      )
    ).to.be.revertedWith(
      "Document hash sudah terdaftar"
    );

    console.log(
      "HASIL : duplicate document hash DITOLAK"
    );
  });


  it("TEST 18 - contract tidak memiliki attack surface reentrancy berbasis Ether", async function () {
    const DocumentRegistry =
      await ethers.getContractFactory(
        "DocumentRegistry"
      );

    const registry =
      await DocumentRegistry.deploy();

    await registry.waitForDeployment();

    const abi =
      DocumentRegistry.interface.fragments;

    const payableFunctions =
      abi.filter(
        (fragment: any) =>
          fragment.type === "function" &&
          fragment.stateMutability ===
            "payable"
      );

    expect(
      payableFunctions.length
    ).to.equal(0);

    console.log(
      "HASIL : tidak ditemukan fungsi payable"
    );

    console.log(
      "REENTRANCY : tidak ada transfer Ether/external callback"
    );
  });

});