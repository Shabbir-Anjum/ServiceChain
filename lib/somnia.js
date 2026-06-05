// Somnia testnet provider + agent signer (ethers v6).
// The agent wallet signs escrow lock / release / proof-write txns.
const { ethers } = require("ethers");
require("dotenv").config();

const RPC = process.env.SOMNIA_RPC || "https://dream-rpc.somnia.network";
const CHAIN_ID = Number(process.env.SOMNIA_CHAIN_ID || 50312);

const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);

function getAgentWallet() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY missing in .env");
  return new ethers.Wallet(pk, provider);
}

const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER || "https://shannon-explorer.somnia.network";
const txUrl = (hash) => `${EXPLORER}/tx/${hash}`;

module.exports = { provider, getAgentWallet, ethers, txUrl, EXPLORER };
