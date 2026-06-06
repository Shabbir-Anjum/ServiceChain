"use client";
// Browser wallet helper — client connects MetaMask, ensures Somnia network,
// and signs the escrow deposit() from their OWN wallet. No private keys ever
// touch the app; the user approves each transaction in MetaMask.
import { BrowserProvider, Contract, parseEther, id as keccakId } from "ethers";

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID || 50312);
const CHAIN_HEX = "0x" + CHAIN_ID.toString(16);
const RPC = process.env.NEXT_PUBLIC_SOMNIA_RPC || "https://dream-rpc.somnia.network";
const ESCROW = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;
const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER || "https://shannon-explorer.somnia.network";

// Minimal ABI — only what the client calls.
const DEPOSIT_ABI = [
  "function deposit(bytes32 jobId, address worker) external payable",
];

const SOMNIA_PARAMS = {
  chainId: CHAIN_HEX,
  chainName: "Somnia Testnet (Shannon)",
  nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
  rpcUrls: [RPC],
  blockExplorerUrls: [EXPLORER],
};

export function hasWallet() {
  return typeof window !== "undefined" && !!window.ethereum;
}

// Already-connected address without prompting (for restoring UI state).
export async function getConnectedAddress() {
  if (!hasWallet()) return null;
  try {
    const accs = await window.ethereum.request({ method: "eth_accounts" });
    return accs?.[0] || null;
  } catch {
    return null;
  }
}

// Subscribe to account changes. Returns an unsubscribe fn.
export function onAccountsChanged(cb) {
  if (!hasWallet()) return () => {};
  const handler = (accs) => cb(accs?.[0] || null);
  window.ethereum.on?.("accountsChanged", handler);
  return () => window.ethereum.removeListener?.("accountsChanged", handler);
}

// Connect + ensure Somnia network. Returns { address }.
export async function connectWallet() {
  if (!hasWallet()) throw new Error("No wallet found. Install MetaMask to pay from your wallet.");
  const eth = window.ethereum;
  const accounts = await eth.request({ method: "eth_requestAccounts" });
  await ensureSomnia(eth);
  return { address: accounts[0] };
}

async function ensureSomnia(eth) {
  const current = await eth.request({ method: "eth_chainId" });
  if (current?.toLowerCase() === CHAIN_HEX) return;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (e) {
    // 4902 = chain not added yet → add it, then it's selected.
    if (e?.code === 4902 || /Unrecognized chain/i.test(e?.message || "")) {
      await eth.request({ method: "wallet_addEthereumChain", params: [SOMNIA_PARAMS] });
    } else {
      throw e;
    }
  }
}

// jobUuid -> bytes32 jobId (must match server: ethers.id(uuid)).
export const toJobId = (uuid) => keccakId(uuid);

// Client signs deposit() — their STT goes into the escrow contract.
// Returns the tx hash after it's mined.
export async function payEscrow({ jobUuid, workerWallet, amountStt }) {
  if (!ESCROW) throw new Error("Escrow address not configured");
  const eth = window.ethereum;
  await ensureSomnia(eth);
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  const escrow = new Contract(ESCROW, DEPOSIT_ABI, signer);
  const tx = await escrow.deposit(toJobId(jobUuid), workerWallet, {
    value: parseEther(String(amountStt)),
  });
  const rcpt = await tx.wait();
  return { hash: rcpt.hash, url: `${EXPLORER}/tx/${rcpt.hash}` };
}
