require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const key = process.env.PRIVATE_KEY;
const accounts = key ? [key.startsWith("0x") ? key : "0x" + key] : [];

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    coreTestnet: {
      url: process.env.CORE_TESTNET_RPC_URL || "https://rpc.test2.btcs.network",
      chainId: 1114,
      accounts
    },
    core: {
      url: process.env.CORE_MAINNET_RPC_URL || "https://rpc.coredao.org",
      chainId: 1116,
      accounts
    }
  }
};