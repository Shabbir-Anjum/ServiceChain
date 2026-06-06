// Deploy AgentVerifier — wires our contract to Somnia's Agentic L1 LLM agent.
// Run: npx hardhat run scripts/deploy-verifier.js --network somnia
//
// Requires in .env:
//   SOMNIA_AGENT_PLATFORM   (testnet: 0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776)
//   SOMNIA_LLM_AGENT_ID     (from the Agent Explorer at https://agents.somnia.network)
const hre = require("hardhat");

async function main() {
  const platform = process.env.SOMNIA_AGENT_PLATFORM || "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776";
  const agentId = process.env.SOMNIA_LLM_AGENT_ID;

  if (!agentId) {
    throw new Error(
      "SOMNIA_LLM_AGENT_ID missing. Get the LLM Inference Agent id from https://agents.somnia.network and add it to .env"
    );
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer (agent wallet):", deployer.address);
  console.log("Platform:", platform);
  console.log("LLM agent id:", agentId);

  const AgentVerifier = await hre.ethers.getContractFactory("AgentVerifier");
  const v = await AgentVerifier.deploy(platform, agentId);
  await v.waitForDeployment();
  const addr = await v.getAddress();
  console.log("\nAgentVerifier deployed:", addr);

  try {
    const dep = await v.getDeposit();
    console.log("Per-call deposit (STT):", hre.ethers.formatEther(dep));
  } catch {
    console.log("(could not read deposit — platform may differ)");
  }

  console.log("\nAdd to .env:");
  console.log(`AGENT_VERIFIER_ADDRESS=${addr}`);
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; });
