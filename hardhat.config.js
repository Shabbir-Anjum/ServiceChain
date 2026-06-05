require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Only use the key if it's a well-formed 32-byte hex (0x + 64 chars).
// Lets `hardhat compile` run before a real key is set.
const RAW_PK = process.env.PRIVATE_KEY || "";
const PRIVATE_KEY = /^0x[0-9a-fA-F]{64}$/.test(RAW_PK) ? RAW_PK : "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    somnia: {
      url: process.env.SOMNIA_RPC || "https://dream-rpc.somnia.network",
      chainId: Number(process.env.SOMNIA_CHAIN_ID || 50312),
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
