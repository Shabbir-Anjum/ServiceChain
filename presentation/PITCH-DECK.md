# ServiceChain — Pitch Deck
### AI Service Marketplace · On-Chain Escrow · Proof-of-Work
**Built on Somnia · Somnia Agentathon 2026**

> **How to use:** each `---` = one slide. Paste into Google Slides / PowerPoint, or render
> with [Marp](https://marp.app) / [Slidev](https://sli.dev). The `> 🎤` blocks are what you
> SAY — don't put them on the slide. Keep slides visual: big headline, few words, one image/diagram.
> **Brand:** bg `#0c0a16`, violet `#8b5cf6`, cyan `#22d3ee`, text `#f3f1fb`.
> **Flow of your talk:** present these 12 slides (~4 min), then switch to the LIVE DEMO (see DEMO-SCRIPT.md).

---

## Slide 1 — Title

# ✦ ServiceChain

## AI agents that **hire, pay & verify** real-world work — on-chain.

Built on **Somnia**

`[ team name · your handle ]`

> 🎤 "Hi — we're ServiceChain. We built a service marketplace where an autonomous AI agent
> hires workers, holds the client's payment in on-chain escrow, and releases it only when the
> work is actually proven done. All on Somnia. Let me show you why that's a big deal."

---

## Slide 2 — The Problem

# Hiring someone you don't know is built on blind trust

- 💸 **Client pays first** → hopes the work happens
- 🔨 **Worker works first** → hopes they get paid
- 🏦 **A platform sits in the middle** — holds the money, takes a cut, owns the trust
- ⭐ **Reviews & proof are fakeable** — "trust me, it's done"

### Fiverr, Upwork, Uber — all rebuild the same fragile middleman.

> 🎤 "Think Uber for home services, or Fiverr. Someone has to go first — and a central company
> holds everyone's money and trust. We asked: what if an AI agent plus a blockchain could replace
> that middleman entirely — cheaper, fairer, and provable?"

---

## Slide 3 — The Solution

# An autonomous agent runs the whole deal

**ServiceChain** — the client just describes a job. The AI agent does the rest:

🧠 **Understands** → 🎯 **Recommends & negotiates** → 🔒 **Escrows payment** → 📸 **Verifies proof** → 💸 **Settles on-chain**

> The blockchain guarantees the money. The agent guarantees the intelligence.
> Neither the platform nor the worker can touch the funds early.

> 🎤 "The agent isn't a chatbot bolted onto an app — it IS the marketplace operator. It thinks,
> it negotiates price like a concierge, it signs the transactions, and it settles the deal. The
> contract holds the money so no one — not even us — can grab it. That's the trustless part."

---

## Slide 4 — How It Works

# One request → a fully managed, on-chain job

```
 Client describes a job in plain English
        │
   🧠 AI parses it (service, urgency, location, fair price)
        │
   🎯 Agent recommends a top pick + a cheaper option
        │
   💬 Client negotiates with the agent (price / quality / swap worker)
        │
   🔒 Client confirms → pays into ESCROW (their wallet) → 📧 worker emailed
        │
   📸 Worker submits proof (photo + note) → 👁️ AI pre-checks
        │
   ✅ Client approves → 💸 worker paid → 📜 proof hash on-chain
   ✕ or disputes (with a reason) → ↩️ client refunded
```

> 🎤 "Left to right. The human does only two things: confirm the hire, and approve the finished
> work. Every other step — and every settlement — is the agent, on-chain. If the work's bad, the
> client disputes with a reason and gets refunded. Fully two-sided."

---

## Slide 5 — Smart Matching, Not a Search Box

# The agent recommends — and negotiates

- 🎯 Recommends the **best-value** worker (rating × price × fit), plus a **cheaper alternative**
- 💬 You can **argue**: *"too expensive?"* → it defends quality, or swaps in another worker
- 💵 Honest concierge — it **won't invent discounts or fake reviews**
- 🗣️ Natural chat until you're confident

> 🎤 "Most marketplaces give you a search box. Ours gives you a concierge. Tell it the job, it
> recommends the right person and prices it. Push back on price and it argues value — or pulls
> a cheaper worker from the pool. But it's honest: it only quotes real ratings and never fakes
> a discount."

---

## Slide 6 — The Trust Breakthrough (Proof-of-Work)

# We killed the "just say it's done" exploit

**The naïve version everyone ships:**
worker types "done" → AI approves → money releases → 🚨 **the worker can lie**

**ServiceChain:**
- 📸 Worker submits **photo + note**
- 👁️ AI **vision pre-screens** the evidence (advisory)
- ✅ The **client** — who saw the real result — gives final approval
- 🔐 The worker **literally cannot approve their own job** (enforced by account on-chain)

> 🎤 "This is the oracle problem: a blockchain holds money perfectly, but something has to
> truthfully say 'the work is real.' We make the client the judge, with AI assisting — exactly
> like Uber and Fiverr, but trustless. We even tested that a worker account is blocked from
> approving its own job. That exploit is closed."

---

## Slide 7 — Real Payments, Non-Custodial

# The client pays from their own wallet

- 💳 Client connects **MetaMask**, pays into the **escrow contract** — not our account
- 🔒 Funds locked on Somnia until the client approves
- 🏦 We **never custody** money or see private keys → no license, no risk
- ⛓️ Every escrow, release, and refund is a **real Somnia transaction**

> 🎤 "When the client confirms, they pay from their own MetaMask straight into the smart
> contract. We never hold the money — the code does. That's what makes it genuinely non-custodial
> and trustless. And it's all verifiable on the Somnia explorer."

---

## Slide 8 — Agent-First & Autonomous (judging fit)

# The agent is the protagonist — and it's verifiable

**Agent-first:** parse → recommend → negotiate → escrow → verify → settle — the agent does it all.

**Autonomous:** the agent **makes decisions and signs real Somnia transactions** itself.

**Provable:** every action → `shannon-explorer.somnia.network` (we'll show live).

> 🎤 "For the Agentathon specifically: this is agent-first and autonomous by design. The agent
> holds a wallet, makes the calls, and settles the deal. We're not showing you a screenshot —
> every step is a transaction you can click and verify on Somnia."

---

## Slide 9 — A Complete, Real Product

# Not a script — a platform

- 🙋 **Client** — posts jobs, negotiates, approves/disputes, sees only their jobs
- 🛠️ **Worker** — signs up, sets wallet + rate + availability, gets hired, submits proof
- 🛡️ **Admin** — oversees all jobs, invites & manages workers
- 🏪 Live marketplace of **20 worker accounts** · role-based access · on-chain audit trail

> 🎤 "We went well past a demo. It's a real product: 20 worker accounts, self-serve onboarding
> where workers set their wallet and availability, role-based access so clients only see their own
> jobs, and a full ops dashboard. Built end-to-end."

---

## Slide 10 — Tech Stack

# Shipped, end-to-end

| Layer | Tech |
|---|---|
| **Blockchain** | **Somnia testnet** — Escrow + ProofRegistry (Solidity), live |
| **Agent brain** | OpenAI GPT-4o — parse, recommend, negotiate, **vision verify** |
| **Payments** | Client MetaMask → escrow · Ethers.js v6 |
| **App** | Next.js 16 · React 19 |
| **Auth / data / files** | Supabase — Auth, Postgres, Storage (proof photos) |
| **Automation** | n8n — auto-emails the hired worker |

> 🎤 "Two contracts live on Somnia, GPT-4o doing the matching and the vision check, MetaMask for
> real payment, Supabase for auth and photo storage, and an n8n automation that emails the worker
> the moment they're hired. It runs."

---

## Slide 11 — Why Somnia

# The chain makes the economics work

- ⚡ **Sub-second finality** — escrow lock & release feel instant
- 💸 **Ultra-low fees** — a $20 micro-job is viable on-chain
- 🔗 **EVM-compatible** — standard Solidity + Ethers
- 🤖 Built for the **agentic** future Somnia is targeting

> 🎤 "Micro-priced service jobs only work on-chain if fees are tiny and settlement is fast.
> Somnia gives us both, and it's EVM-compatible so our agent uses standard tooling. This is
> exactly the agentic, real-world use case Somnia is built for."

---

## Slide 12 — Demo + Close

# 🎬 Let's see it live

**Watch the agent run a real job — hands-off, on Somnia.**

post → recommend → negotiate → **pay escrow** → proof → **approve** → paid ✅

🔗 `[ live URL ]` · 🔍 shannon-explorer.somnia.network · 💻 `[ repo ]`

### ✦ ServiceChain — the trustless service economy, powered by AI agents.

> 🎤 "Enough slides — let me show you the real thing." → **switch to the live demo.**
> (After the demo, land back here for thanks + questions.)

---

## Appendix A — Architecture (if asked)

```
Next.js app ─► API routes ─► AI Agent (GPT-4o)
                  │               ├─ parse / recommend / negotiate
                  │               ├─ vision verify (advisory)
                  │               └─ Ethers.js ─► Somnia (Escrow, ProofRegistry)
                  ├─ Client MetaMask ─► deposit() into Escrow
                  ├─ Supabase (Auth · Postgres · Storage)
                  └─ n8n webhook ─► worker email
```

## Appendix B — Q&A cheat sheet

- **"Can a worker fake the photo?"** → AI pre-screens it, but the *client* gives final approval —
  they saw the real result. No text-only system is fully fraud-proof; the human is the backstop,
  like every real marketplace. We closed the self-approval exploit on-chain.
- **"Why blockchain, not a database?"** → The money sits in code, not our account. Neither we nor
  the worker can touch it early. That's the trust guarantee a database can't give.
- **"Is the client really paying?"** → Yes — they sign the deposit in their own MetaMask; funds
  leave their wallet into the escrow contract. We're non-custodial.
- **"Is this really on Somnia?"** → Two contracts deployed to Somnia testnet; every
  escrow/release/refund/proof is a real tx on shannon-explorer.
- **"How do you make money?"** → Future: a small platform fee taken automatically at release,
  split by the contract. We left it out to keep the demo focused.
