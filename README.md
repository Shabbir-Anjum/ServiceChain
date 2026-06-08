<div align="center">

# ✦ ServiceChain

### AI agents that **hire, pay & verify** real-world work — on-chain.

**An AI service marketplace with non-custodial escrow & proof-of-work, built on Somnia.**

Somnia Agentathon 2026 · `[ https://youtu.be/QPzme9i3Qyw ]` · [Somnia Explorer](https://shannon-explorer.somnia.network)

</div>

---

## 🌐 What it is

ServiceChain is a service marketplace (think Uber/Fiverr for home services) where an **autonomous AI agent runs the entire hiring deal** on the Somnia blockchain — and no central platform ever holds the money.

A client describes a job in plain English. The agent understands it, recommends the best worker, negotiates price, locks the client's payment in an on-chain escrow, verifies the worker's proof of completion, and settles — releasing payment to the worker or refunding the client. Every settlement is a real transaction on Somnia.

## 🎯 The problem we solve

Service marketplaces run on blind trust: the client pays first and hopes, or the worker works first and hopes — while a central platform holds everyone's money and trust, and "proof" is just *"trust me, it's done."*

**ServiceChain replaces the middleman with an AI agent + a smart contract:**

- 💸 The **client pays into escrow from their own wallet** — non-custodial, neither the platform nor the worker can touch it early.
- 📸 The **worker submits photo proof**; AI vision pre-screens it, but the **client gives final approval** — closing the "just say it's done" fraud exploit (a worker literally cannot approve their own job).
- ⚖️ Bad work? The client **disputes with a reason** and is refunded. Every step is recorded on-chain.

## ✨ Key features

| | |
|---|---|
| 🧠 **Plain-English intake** | GPT-4o parses a request into service, urgency, location, fair price. |
| 🎯 **Smart matching** | Recommends the best-value worker + a cheaper alternative — not a search box. |
| 💬 **Negotiation chat** | Argue on price; the agent defends quality or swaps in another worker — honestly (no fake discounts). |
| 💳 **Non-custodial escrow** | Client pays via MetaMask straight into the escrow contract on Somnia. |
| 📸 **Proof-of-work** | Worker submits photo + note; AI vision pre-checks; **client approves**. |
| ⚖️ **Disputes** | Refund with a recorded, on-chain reason. |
| 🛡️ **Roles** | Client / Worker / Admin with role-based access (clients see only their jobs). |
| 📜 **On-chain audit trail** | Escrow, release, refund, and proof hashes — all verifiable on Somnia. |

## 🏆 Why it fits the Somnia Agentathon

- **Agent-native (Somnia Agentic L1) — LIVE:** proof verification runs on **Somnia's on-chain LLM Inference Agent**. Our [`AgentVerifier`](https://shannon-explorer.somnia.network/address/0x01E09E5dd50A332a7C2CA597e5F202EA9794A655) contract calls the platform requester (`createRequest`), a validator subcommittee runs the model, reaches consensus, and the **verdict is written on-chain** — typically in **3–7 seconds**, ~0.24 STT per call. The AI verdict isn't a private server call; it's a Somnia primitive. (GPT-4o stays as a fallback + for image/vision, which the on-chain LLM doesn't do.)
- **Agent-first:** the agent IS the operator — parse → recommend → negotiate → escrow → verify → settle.
- **Autonomous:** the agent makes decisions and **signs real Somnia transactions** itself.
- **Provable:** every action is a transaction on [shannon-explorer.somnia.network](https://shannon-explorer.somnia.network).
- **Why Somnia:** sub-second finality + ultra-low fees make micro-priced ($20) real-world jobs viable on-chain — and its Agentic L1 lets contracts run consensus-validated AI.

---

## 🔗 Deployed contracts (Somnia Shannon testnet)

| Contract | Address |
|---|---|
| **Escrow** | [`0x21058fB4b6F621F3770B1650218209e9dB184F25`](https://shannon-explorer.somnia.network/address/0x21058fB4b6F621F3770B1650218209e9dB184F25) |
| **ProofRegistry** | [`0x180eBF385A46d41F8B796fb6aF275c9C0892F659`](https://shannon-explorer.somnia.network/address/0x180eBF385A46d41F8B796fb6aF275c9C0892F659) |
| **AgentVerifier** (on-chain LLM proof check) | [`0x01E09E5dd50A332a7C2CA597e5F202EA9794A655`](https://shannon-explorer.somnia.network/address/0x01E09E5dd50A332a7C2CA597e5F202EA9794A655) |

Network: Somnia Testnet (Shannon) · chainId `50312` · RPC `https://dream-rpc.somnia.network` · currency STT.
---

## 🔑 Test accounts

> Pre-seeded so you can log in instantly. All verified working.

### Admin & Client

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@servicechain.app` | `Admin@2026` |
| **Client** | `client@servicechain.app` | `Client@2026` |

### Worker accounts (20)

Password pattern: `ChangeMe-<id>-2026`

| # | Name | Role | Email | Password |
|---|---|---|---|---|
| w1 | Ali Raza | Plumber | `w1@seed.servicechain.local` | `ChangeMe-w1-2026` |
| w2 | Sara Khan | Electrician | `w2@seed.servicechain.local` | `ChangeMe-w2-2026` |
| w3 | Hassan Iqbal | Cleaner | `w3@seed.servicechain.local` | `ChangeMe-w3-2026` |
| w4 | Bilal Ahmed | Painter | `w4@seed.servicechain.local` | `ChangeMe-w4-2026` |
| w5 | Ayesha Malik | Carpenter | `w5@seed.servicechain.local` | `ChangeMe-w5-2026` |
| w6 | Usman Tariq | AC Technician | `w6@seed.servicechain.local` | `ChangeMe-w6-2026` |
| w7 | Fatima Noor | Gardener | `w7@seed.servicechain.local` | `ChangeMe-w7-2026` |
| w8 | Hamza Sheikh | Mover | `w8@seed.servicechain.local` | `ChangeMe-w8-2026` |
| w9 | Zainab Riaz | Tech Support | `w9@seed.servicechain.local` | `ChangeMe-w9-2026` |
| w10 | Imran Qureshi | Plumber | `w10@seed.servicechain.local` | `ChangeMe-w10-2026` |
| w11 | Sana Javed | Cleaner | `w11@seed.servicechain.local` | `ChangeMe-w11-2026` |
| w12 | Tariq Mehmood | Electrician | `w12@seed.servicechain.local` | `ChangeMe-w12-2026` |
| w13 | Hira Aslam | Painter | `w13@seed.servicechain.local` | `ChangeMe-w13-2026` |
| w14 | Kashif Raza | Carpenter | `w14@seed.servicechain.local` | `ChangeMe-w14-2026` |
| w15 | Nida Farooq | AC Technician | `w15@seed.servicechain.local` | `ChangeMe-w15-2026` |
| w16 | Owais Khan | Gardener | `w16@seed.servicechain.local` | `ChangeMe-w16-2026` |
| w17 | Rabia Saleem | Mover | `w17@seed.servicechain.local` | `ChangeMe-w17-2026` |
| w18 | Faisal Abbas | Tech Support | `w18@seed.servicechain.local` | `ChangeMe-w18-2026` |
| w19 | Maham Tariq | Cleaner | `w19@seed.servicechain.local` | `ChangeMe-w19-2026` |
| w20 | Junaid Akhtar | Electrician | `w20@seed.servicechain.local` | `ChangeMe-w20-2026` |

> ⚠️ Demo credentials on testnet only — rotate before any real deployment.

---

## 🧱 Tech stack

| Layer | Tech |
|---|---|
| Blockchain | **Somnia testnet** — Escrow + ProofRegistry (Solidity 0.8.24), Hardhat |
| Agent | OpenAI **GPT-4o** — parse, recommend, negotiate, **vision verify** |
| Payments | Client **MetaMask** → escrow · **Ethers.js v6** |
| App | **Next.js 16** · React 19 (App Router) |
| Auth / data / files | **Supabase** — Auth, Postgres, Storage (proof photos), RLS |
| Automation | **n8n** — emails the hired worker on confirmation |

## 🗺️ Architecture

```
Next.js app ─► API routes ─► AI Agent (GPT-4o)
                  │               ├─ parse · recommend · negotiate
                  │               ├─ vision verify (advisory)
                  │               └─ Ethers.js ─► Somnia (Escrow, ProofRegistry)
                  ├─ Client MetaMask ─► deposit() into Escrow (non-custodial)
                  ├─ Supabase (Auth · Postgres · Storage)
                  └─ n8n webhook ─► worker email
```

**The trust model:** funds live in the Escrow contract — not a platform wallet. Only the agent address can `release()`/`refund()`, and only the job's client (`client_id == auth.uid()`) can trigger that decision. A worker can never approve their own job. Verified end-to-end (20/20 integration checks).

---

## 🚀 Run locally

### Prerequisites
- Node 18+ · a Supabase project · an OpenAI API key · MetaMask (for the client-pay flow)

### 1. Install
```bash
npm install
```

### 2. Configure `.env` (copy from `.env.example`)
```bash
PRIVATE_KEY=0x...              # agent wallet (testnet only)
SOMNIA_RPC=https://dream-rpc.somnia.network
SOMNIA_CHAIN_ID=50312
ESCROW_ADDRESS=0x21058fB4b6F621F3770B1650218209e9dB184F25
PROOF_REGISTRY_ADDRESS=0x180eBF385A46d41F8B796fb6aF275c9C0892F659
NEXT_PUBLIC_ESCROW_ADDRESS=0x21058fB4b6F621F3770B1650218209e9dB184F25
NEXT_PUBLIC_SOMNIA_RPC=https://dream-rpc.somnia.network
NEXT_PUBLIC_SOMNIA_CHAIN_ID=50312
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_EXPLORER=https://shannon-explorer.somnia.network
```

### 3. Contracts (already deployed; redeploy only if needed)
```bash
npm run compile
npm run deploy                 # prints new addresses → update .env
```

### 4. Start
```bash
npm run dev                    # http://localhost:3000
```


---

## 🔭 Roadmap

- On-chain AI verification via **Somnia's consensus-validated agents** (move the vision check on-chain).
- **Agent-to-agent**: a worker-side agent that auto-negotiates and accepts.
- A **platform fee** split automatically by the contract at release.
- Auto-release dispute window; multi-photo / before-after proof.

---

<div align="center">

**✦ ServiceChain — the trustless service economy, powered by AI agents.**

Built on Somnia.

</div>
