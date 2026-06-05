// Contract instances bound to the agent wallet (for writes) and provider (reads).
const { ethers, getAgentWallet, provider } = require("./somnia");
const { ESCROW_ABI, PROOF_ABI } = require("./abis");
require("dotenv").config();

const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS;
const PROOF_REGISTRY_ADDRESS = process.env.PROOF_REGISTRY_ADDRESS;

function escrowWrite() {
  return new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, getAgentWallet());
}
function proofWrite() {
  return new ethers.Contract(PROOF_REGISTRY_ADDRESS, PROOF_ABI, getAgentWallet());
}
function escrowRead() {
  return new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
}

// Turn an off-chain uuid into a stable bytes32 jobId.
const toJobId = (uuid) => ethers.id(uuid);

module.exports = {
  escrowWrite,
  proofWrite,
  escrowRead,
  toJobId,
  ESCROW_ADDRESS,
  PROOF_REGISTRY_ADDRESS,
};
