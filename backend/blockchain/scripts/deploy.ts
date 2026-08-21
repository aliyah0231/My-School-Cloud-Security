import { ethers } from "hardhat";

async function main() {
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");

  const documentRegistry = await DocumentRegistry.deploy();

  await documentRegistry.waitForDeployment();

  const address = await documentRegistry.getAddress();

  console.log("DocumentRegistry deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});