# AI Service Marketplace · On-Chain Escrow & Proof (Somnia Agentathon)

An **autonomous AI agent** that runs a service marketplace end to end: it parses a
client request, matches a worker, locks payment in **on-chain escrow on Somnia**,
verifies completion, releases payment, and writes an **immutable proof hash** — all
hands-off. Humans only fund the job and submit proof.

> Built for the Somnia Agentathon. Judging axes: functionality, **agent-first design**,
> innovation, **autonomous performance** — the agent is the actor at every step.

## How it works

```
Client posts job ─► AGENT (autonomous):
  parse (GPT-4o) → match worker (GPT-4o) → lock escrow on-chain (agent signs)
Worker submits proof ─► AGENT (autonomous):
  verify proof (GPT-4o) → release payment OR refund (agent signs) → record proof hash on-chain
Dashboard shows every decision + tx link, live.
```

- **On-chain (Somnia):** escrow deposit/lock, release/refund, proof hash + status + timestamp.
- **Off-chain (Supabase):** worker pool, job records, agent reasoning logs.
- **Orchestration (n8n Cloud):** webhook → agent endpoints → notifications.

## Tech stack

Next.js · OpenAI GPT-4o · Ethers.js v6 · Hardhat + Solidity · Supabase · n8n Cloud
· **Somnia Testnet (Shannon)**.

## Somnia testnet

| | |
|---|---|
| Chain ID | `50312` |
| RPC | `https://dream-rpc.somnia.network` |
| Currency | STT |
| Explorer | https://shannon-explorer.somnia.network |
| Faucet | https://testnet.somnia.network/ |

## Setup

1. **Install** (already done if cloned with `node_modules`):
   ```bash
   npm install
   ```
2. **Credentials** — copy `.env.example` to `.env` and fill in:
   - `PRIVATE_KEY` — a **fresh** MetaMask wallet, testnet only (never a real-money key).
   - `OPENAI_API_KEY` — your OpenAI key.
   - Supabase URL + keys (optional for demo; an in-memory store works without it).
3. **Fund the agent wallet** with free STT from the faucet.
4. **Deploy contracts** to Somnia:
   ```bash
   npm run compile
   npm run deploy
   ```
   Copy the printed `ESCROW_ADDRESS` and `PROOF_REGISTRY_ADDRESS` into `.env`.
5. **(Optional) Supabase** — run `supabase/schema.sql` in the SQL editor.
6. **(Optional) n8n** — import `n8n/workflow.json`; set env `APP_URL` to your app URL.

## Run

```bash
npm run dev
```

- **Client** (`/`): post a job → agent parses, matches, locks escrow.
- **Worker** (`/worker`): paste job id + proof → agent verifies, releases/refunds, records proof.
- **Dashboard** (`/dashboard`): live agent steps + on-chain tx links.

## Demo script (the winning 60 seconds)

1. On **Client**, post: *"Fix my leaking kitchen sink urgently in Lahore."*
2. Watch the agent parse → match a worker → **lock escrow** (tx on explorer).
3. Copy the job id. On **Worker**, submit proof: *"Replaced the U-bend, sealed the joint, tested — no leaks."*
4. Agent **verifies** → **releases payment** (tx) → **records proof hash** (tx).
5. Open **Dashboard** — three agent-signed txns, zero manual approvals. Walk the judges through the explorer links.

> The point: *fund it, walk away, and the agent closes the whole deal safely.*

## Project structure

```
contracts/     Escrow.sol, ProofRegistry.sol
scripts/       deploy.js
agent/         parseJob, matchWorker, verifyProof, executor, index (the loop)
lib/           somnia, openai, supabase, contracts, abis, jobstore
app/           Next.js (client / worker / dashboard + api routes)
n8n/           importable workflow
supabase/      schema.sql
```

## Notes & limits (MVP)

- Proof verification is **text-based** (deterministic, demo-safe). Image/vision proof is a stretch goal.
- For a hands-off demo the **agent wallet funds escrow** on the client's behalf. In production the client funds `deposit()` directly from MetaMask (the function is `payable`); only `release`/`refund` are agent-gated.
- Worker pool is seeded; wire `app/workers.js` to Supabase for real profiles.
```
