// Canonical step list — single source of truth for the hero pipeline,
// the agent-run checklist, and the dashboard timeline. Keeps icon/label/color
// parity across every surface (design critique #4).

export const STEPS = [
  { key: "parsed",           icon: "🧠", label: "Parsed request",   status: "info" },
  { key: "matched",          icon: "🤝", label: "Matched worker",   status: "info" },
  { key: "escrow_locked",    icon: "🔒", label: "Escrow locked",    status: "violet" },
  { key: "verified",         icon: "🔍", label: "Verified proof",   status: "info" },
  { key: "payment_released", icon: "💸", label: "Payment released", status: "success" },
  { key: "client_refunded",  icon: "↩️", label: "Client refunded",  status: "danger" },
  { key: "proof_recorded",   icon: "📜", label: "Proof recorded",   status: "success" },
];

// The 5-stage pipeline shown on the hero (compressed, settlement merged).
export const PIPELINE = [
  { icon: "📝", label: "Request" },
  { icon: "🧠", label: "Parse" },
  { icon: "🤝", label: "Match" },
  { icon: "🔒", label: "Escrow" },
  { icon: "🔍", label: "Verify" },
  { icon: "💸", label: "Pay" },
  { icon: "📜", label: "Proof" },
];

export const STEP_MAP = Object.fromEntries(STEPS.map((s) => [s.key, s]));

// Map a job status -> pill variant + label.
export const STATUS_PILL = {
  created:       { cls: "is-info",    label: "Created" },
  escrow_locked: { cls: "is-violet",  label: "Escrow locked" },
  paid:          { cls: "is-success", label: "Paid" },
  refunded:      { cls: "is-danger",  label: "Refunded" },
};
