// Deploy Escrow + ProofRegistry to Somnia testnet.
// Run: npx hardhat run scripts/deploy.js --network somnia
const hre = require("hardhat");

async function main() {
  const [agent] = await hre.ethers.getSigners();
  console.log("Agent (deployer) address:", agent.address);

  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(agent.address);
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log("Escrow deployed:        ", escrowAddr);

  const ProofRegistry = await hre.ethers.getContractFactory("ProofRegistry");
  const proof = await ProofRegistry.deploy(agent.address);
  await proof.waitForDeployment();
  const proofAddr = await proof.getAddress();
  console.log("ProofRegistry deployed: ", proofAddr);

  console.log("\nAdd these to your .env:");
  console.log(`ESCROW_ADDRESS=${escrowAddr}`);
  console.log(`PROOF_REGISTRY_ADDRESS=${proofAddr}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
