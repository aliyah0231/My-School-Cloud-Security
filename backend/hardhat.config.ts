import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",

  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: "remote",
    },
  },
};

export default config;