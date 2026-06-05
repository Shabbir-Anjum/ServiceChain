// On-chain actions, signed by the AGENT wallet (ethers v6).
// These are the autonomous moves: lock escrow, release/refund, record proof.
const { escrowWrite, proofWrite, toJobId } = require("../lib/contracts");
const { ethers, txUrl } = require("../lib/somnia");

// NOTE: In a full marketplace the CLIENT funds the escrow from their own wallet
// (deposit is payable, called client-side via MetaMask). For an autonomous
// hackathon demo we let the agent wallet fund on the client's behalf so the
// whole loop runs hands-off. Swap `lockEscrow` for a client-side deposit later.

async function lockEscrow(jobUuid, workerWallet, amountSTT) {
  const escrow = escrowWrite();
  const jobId = toJobId(jobUuid);
  const tx = await escrow.deposit(jobId, workerWallet, {
    value: ethers.parseEther(String(amountSTT)),
  });
  const rcpt = await tx.wait();
  return { hash: rcpt.hash, url: txUrl(rcpt.hash), jobId };
}

async function releasePayment(jobUuid) {
  const escrow = escrowWrite();
  const tx = await escrow.release(toJobId(jobUuid));
  const rcpt = await tx.wait();
  return { hash: rcpt.hash, url: txUrl(rcpt.hash) };
}

async function refundClient(jobUuid) {
  const escrow = escrowWrite();
  const tx = await escrow.refund(toJobId(jobUuid));
  const rcpt = await tx.wait();
  return { hash: rcpt.hash, url: txUrl(rcpt.hash) };
}

async function recordProof(jobUuid, proofText, status) {
  const proof = proofWrite();
  const dataHash = ethers.id(proofText); // keccak256 of proof payload
  const tx = await proof.recordProof(toJobId(jobUuid), dataHash, status);
  const rcpt = await tx.wait();
  return { hash: rcpt.hash, url: txUrl(rcpt.hash), dataHash };
}

module.exports = { lockEscrow, releasePayment, refundClient, recordProof };
