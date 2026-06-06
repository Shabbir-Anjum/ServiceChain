# ServiceChain — Live Demo Script
### Use AFTER the slides. Target: **3–4 minutes** live (or record a 2:30 video).

> You'll present the deck first, then say *"let me show you the real thing"* and run this.
> **Golden rule:** keep the **Somnia explorer** visible whenever a transaction happens — that's
> your proof. Show, don't tell.

---

## ⏱️ Pre-flight checklist (do this BEFORE you present)

- [ ] App running at `http://localhost:3000`, on the landing page, logged out.
- [ ] **Two browser windows** side by side (or two profiles):
  - **Client:** `client@servicechain.app` / `Client@2026`
  - **Worker (Ali Raza):** `w1@seed.servicechain.local` / `ChangeMe-w1-2026`
- [ ] **MetaMask** installed in the client window, with:
  - Somnia testnet added (the app auto-adds it on first connect; chainId 50312)
  - A test wallet **funded with STT** from https://testnet.somnia.network/
- [ ] A **proof photo** saved locally to upload (any plumbing/repair image).
- [ ] A tab open to **https://shannon-explorer.somnia.network**.
- [ ] Email confirmation OFF in Supabase (already done) so logins are instant.
- [ ] Do a **full dry run** right before — post, negotiate, pay, proof, approve. Re-fund the
      agent wallet if needed.
- [ ] Close other tabs/notifications. Zoom ~110%. Clean cursor.

> **Demo safety net:** if MetaMask glitches, the app **auto-falls back to agent-funded escrow** —
> the flow still completes. So a wallet hiccup won't kill your demo.

---

## SCENE 0 — Transition from slides (0:00)

**Say:** *"Enough slides — here's the real thing, running on Somnia testnet."*
**Do:** switch to the browser, landing page visible.

---

## SCENE 1 — The marketplace (0:00 – 0:20)

**On screen:** Landing hero, then scroll to show the **20 worker cards** (skills, ratings,
availability), then back up to "Post a job".

**Say:**
> "This is ServiceChain. Real workers — each with skills, ratings, availability, and their own
> wallet. I'm logged in as a client. Watch the agent handle an entire job."

---

## SCENE 2 — Post a job → recommendation (0:20 – 0:45)

**On screen:** In "Post a job", type:
> `Fix my leaking kitchen sink urgently in Lahore`

Click **Get recommendation**. The agent returns **Ali Raza — Top pick — $75** and a cheaper
alternative.

**Say:**
> "I describe the job in plain English. The agent understands it's urgent plumbing in Lahore,
> and recommends the best worker — Ali Raza — and prices the job itself, in dollars. It also
> offers a cheaper option."

---

## SCENE 3 — Negotiate (0:45 – 1:15)

**On screen:** In the chat, type:
> `that's expensive — anyone cheaper?`

Show the agent's reply (defends value, offers the cheaper worker with an honest tradeoff). Then:
> `ok, go with the top pick`

**Say:**
> "And I can negotiate — like a real concierge. I push back on price, and it makes the case for
> quality, reminds me escrow protects me, and honestly offers the cheaper option with its tradeoff.
> It won't invent discounts. I'll take the top pick."

---

## SCENE 4 — Pay into escrow with MetaMask (1:15 – 1:45) ⭐ KEY MOMENT

**On screen:** Click **Hire Ali**. MetaMask pops up: *"Approve 0.01 STT."* **Approve it.** The
success card shows **"Ali Raza is hired!"** with **🔒 Escrow secured**, **💳 Paid from your
wallet**, **📧 Worker emailed**. Click the escrow tx → **Somnia explorer** shows the real tx.

**Say:**
> "When I confirm, I pay from *my own wallet* — straight into the escrow contract. There's the
> MetaMask prompt… approved. And here's the real transaction on Somnia. The money is now locked
> in code — not in the platform's account — and the worker's been emailed automatically. This is
> non-custodial: we never hold the funds."

**Cut note (video):** this explorer shot is your #1 proof. Hold it ~2 seconds.

---

## SCENE 5 — Worker submits proof (1:45 – 2:15)

**On screen:** Switch to the **worker** window (Ali Raza) → **My jobs** → open the assigned job →
**upload the proof photo** (show the preview) → type:
> `Replaced the U-bend, sealed the joint, ran water 5 minutes — no leaks.`

Click **Submit for client approval**. Show **"Awaiting client approval"** + the **👁️ AI
pre-check**.

**Say:**
> "Now the worker. Ali does the job and submits proof — a photo plus a note. The AI vision model
> pre-checks the photo against the job. But here's the key: the worker can't approve their own
> job. The money is still locked."

---

## SCENE 6 — Client approves → payment releases (2:15 – 2:45)

**On screen:** Switch to the **client** window → **Dashboard**. The job shows **"Awaiting
approval"** with the worker's **photo + note + AI advisory**. Click **✓ Approve & pay**. Status
flips to **Paid**; timeline fills in. Click the payment tx → explorer shows the release.

**Say:**
> "Back as the client, I see the actual photo and the AI's assessment — and I make the final call.
> I approve. The agent instantly releases payment to the worker and records an immutable proof of
> the job on-chain. Hired, paid, and verified — trustlessly."

---

## SCENE 7 (optional) — Dispute with a reason (2:45 – 3:05)

> Only show if you have time. Use a SECOND job for this, or describe it verbally.

**On screen:** On a different submitted job, click **✕ Dispute** → a reason box appears → type
*"Work not done — photo doesn't match"* → **Confirm dispute & refund**. Status → **Refunded**,
showing **↩️ Disputed: <reason>**.

**Say:**
> "And it's two-sided. If the work's bad, the client disputes — with a reason that's recorded
> on-chain — and gets refunded automatically. Workers are protected by escrow; clients are
> protected by approval."

---

## SCENE 8 — Close (3:05 – 3:20)

**On screen:** Dashboard timeline with all the tx links, or the Somnia explorer showing the job's
3+ transactions. Then back to slides (Close slide).

**Say:**
> "An autonomous agent ran that entire deal — recommending, negotiating, escrowing, verifying,
> and settling — with every action provable on Somnia. That's ServiceChain. Thank you — happy to
> take questions."

---

## 2:30 VIDEO CUT (if you record instead of presenting live)

1. **(0:00–0:12)** Hero + line: *"An autonomous AI agent that hires, pays, and verifies real work on Somnia."*
2. **(0:12–0:30)** Post the sink request → recommendation ($75 + cheaper). *"It understands and prices the job."*
3. **(0:30–0:48)** One price objection → agent replies → "go with top pick".
4. **(0:48–1:15)** Click Hire → **MetaMask pay** → escrow tx on explorer. *"I pay from my own wallet into the contract — real Somnia tx."*
5. **(1:15–1:35)** Worker uploads photo proof → "awaiting approval". *"The worker proves it — but can't approve their own job."*
6. **(1:35–1:55)** Client approves → **Paid** → release tx on explorer. *"The client approves, payment releases on-chain, proof recorded forever."*
7. **(1:55–2:05)** (optional) flash a dispute-with-reason → refunded.
8. **(2:05–2:15)** End card: ✦ ServiceChain · Built on Somnia · `[URL]`.

---

## Narration-only (for voiceover / TTS)

> This is ServiceChain — a marketplace where an autonomous AI agent hires, pays, and verifies
> real-world work, all on Somnia.
>
> I describe a job in plain English — fix my leaking sink, urgently, in Lahore. The agent
> understands it and recommends the best worker, Ali Raza, for seventy-five dollars, with a
> cheaper option too.
>
> I can negotiate. I push back on price; the agent makes the case for quality, reminds me escrow
> protects me, and honestly offers the cheaper option — without inventing discounts.
>
> When I confirm, I pay from my own MetaMask wallet straight into the escrow contract — a real
> transaction on Somnia. We never hold the money; the code does. The worker is emailed automatically.
>
> The worker does the job and submits proof — a photo and a note. AI vision pre-checks it, but the
> worker can't approve their own job.
>
> Back as the client, I review the real photo and the AI's take, and I make the final call. I
> approve — and payment releases to the worker instantly, with an immutable proof recorded
> on-chain. And if the work were bad, I'd dispute with a reason and get refunded.
>
> An autonomous agent ran that entire deal, with every action provable on Somnia. That's
> ServiceChain — the trustless service economy, powered by AI agents.

---

## Do's & Don'ts

**Do**
- Keep the **explorer visible** for every transaction — it's your credibility.
- Use the exact phrasing *"Fix my leaking kitchen sink urgently in Lahore"* — it reliably matches Ali Raza.
- Pre-fund both the **client wallet** (for MetaMask pay) and the **agent wallet** (fallback) before recording.
- If presenting live and short on time, skip Scene 7 (dispute).

**Don't**
- Don't narrate the tech stack during the demo — that's the deck's job.
- Don't show the `.env`, private keys, or passwords on screen.
- Don't claim "100% fraud-proof" — say "the client is the final verifier" (true + credible).
- Don't let a slow tx create dead air — trim it in the edit / keep talking over it.
