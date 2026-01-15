import "dotenv/config";

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import HardhatIgnitionEthersPlugin from "@nomicfoundation/hardhat-ignition-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin, HardhatIgnitionEthersPlugin],
  paths: {
    sources: "./contracts",
  },
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
    },
  },

  networks: {
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_RPC_URL!,
      accounts: [process.env.EVM_PRIVATE_KEY!],
      chainId: 11155111,
    },
    arbSepolia: {
      type: "http",
      url: process.env.ARB_SEPOLIA_RPC_URL!,
      accounts: [process.env.EVM_PRIVATE_KEY!],
      chainId: 421614,
    },
  },
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY,
    },
  },
});
