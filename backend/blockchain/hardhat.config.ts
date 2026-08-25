import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { readFileSync } from "node:fs";
import path from "node:path";

const privateKeyPath = path.resolve(
  process.cwd(),
  "../../secrets/blockchain_private_key.txt"
);

const privateKey = readFileSync(privateKeyPath, "utf8").trim();

if (!privateKey) {
  throw new Error("Blockchain private key kosong.");
}

const config: HardhatUserConfig = {
  solidity: "0.8.28",

  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: [privateKey],
    },
  },
};

export default config;