// Job store with a Supabase (Postgres) backend and an automatic in-memory
// fallback. If Supabase is configured AND the `jobs` table is reachable, jobs
// persist to the database. Otherwise everything transparently falls back to an
// in-memory Map so the demo never breaks (missing tables, no creds, network blip).
//
// All methods are async. The in-memory map is pinned to globalThis so it
// survives Next dev hot-reloads.

const { supabase } = require("./supabase");

const g = globalThis;
if (!g.__SC_STORE) g.__SC_STORE = { jobs: new Map(), seq: 0, dbOk: null };
const MEM = g.__SC_STORE;

// One-time probe: is the `jobs` table actually usable? Cached on globalThis.
async function dbReady() {
  if (!supabase) return false;
  if (MEM.dbOk !== null) return MEM.dbOk;
  try {
    // Use select('*'): a missing table reliably returns PGRST205 here, whereas
    // head:true or selecting a named column can silently return empty (200) for
    // a missing table due to PostgREST schema-cache quirks.
    const { error } = await supabase.from("jobs").select("*").limit(1);
    MEM.dbOk = !error;
  } catch {
    MEM.dbOk = false;
  }
  if (!MEM.dbOk) console.warn("[jobstore] Supabase 'jobs' table not reachable — using in-memory store.");
  return MEM.dbOk;
}

// ── in-memory helpers ──
function memCreate(uuid, requestText, clientId) {
  const rec = { uuid, requestText, job: null, worker: null, estimated: 0, amount: 0, status: "created", steps: [], seq: ++MEM.seq, clientId: clientId || null, workerId: null };
  MEM.jobs.set(uuid, rec);
  return rec;
}

// ── DB row <-> app record mapping ──
const rowToRec = (r) => ({
  uuid: r.uuid,
  requestText: r.request_text,
  job: r.parsed,
  worker: r.worker,
  estimated: r.estimated,
  amount: r.amount,
  status: r.status,
  steps: r.steps || [],
  seq: r.seq,
  clientId: r.client_id || null,
  workerId: r.worker_id || null,
});

async function create(uuid, requestText, clientId) {
  if (await dbReady()) {
    const { data, error } = await supabase
      .from("jobs")
      .insert({ uuid, request_text: requestText, status: "created", steps: [], client_id: clientId || null })
      .select()
      .single();
    if (!error && data) return rowToRec(data);
  }
  return memCreate(uuid, requestText, clientId);
}

async function get(uuid) {
  if (await dbReady()) {
    const { data, error } = await supabase.from("jobs").select("*").eq("uuid", uuid).maybeSingle();
    if (!error && data) return rowToRec(data);
  }
  return MEM.jobs.get(uuid);
}

async function update(uuid, patch) {
  if (await dbReady()) {
    // Map app fields -> db columns.
    const row = {};
    if (patch.job !== undefined) row.parsed = patch.job;
    if (patch.worker !== undefined) row.worker = patch.worker;
    if (patch.estimated !== undefined) row.estimated = patch.estimated;
    if (patch.amount !== undefined) row.amount = patch.amount;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.workerId !== undefined) row.worker_id = patch.workerId;
    if (patch.clientId !== undefined) row.client_id = patch.clientId;
    row.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from("jobs").update(row).eq("uuid", uuid).select().single();
    if (!error && data) return rowToRec(data);
  }
  const rec = MEM.jobs.get(uuid);
  if (rec) Object.assign(rec, patch);
  return rec || null;
}

async function pushSteps(uuid, steps) {
  if (await dbReady()) {
    // Append by reading current steps then writing back (simple + fine at demo scale).
    const { data: cur } = await supabase.from("jobs").select("steps").eq("uuid", uuid).maybeSingle();
    const next = [...((cur && cur.steps) || []), ...steps];
    const { data, error } = await supabase
      .from("jobs")
      .update({ steps: next, updated_at: new Date().toISOString() })
      .eq("uuid", uuid)
      .select()
      .single();
    if (!error && data) return rowToRec(data);
  }
  const rec = MEM.jobs.get(uuid);
  if (rec) rec.steps.push(...steps);
  return rec || null;
}

async function all() {
  if (await dbReady()) {
    const { data, error } = await supabase.from("jobs").select("*").order("seq", { ascending: false }).limit(50);
    if (!error && data) return data.map(rowToRec);
  }
  return [...MEM.jobs.values()].sort((a, b) => b.seq - a.seq);
}

// Role-scoped listing — used by the status endpoint to show only what a user
// may see. admin -> all; client -> own (client_id); worker -> assigned (worker_id).
// We filter with the service-role client (RLS is the DB backstop; this is the
// authoritative app-level gate since the agent itself needs full access).
async function forUser({ role, userId, workerId }) {
  if (role === "admin") return all();

  if (await dbReady()) {
    let q = supabase.from("jobs").select("*").order("seq", { ascending: false }).limit(50);
    if (role === "worker") q = q.eq("worker_id", workerId || "__none__");
    else q = q.eq("client_id", userId || "__none__"); // default: client
    const { data, error } = await q;
    if (!error && data) return data.map(rowToRec);
  }

  // in-memory fallback
  const list = [...MEM.jobs.values()].sort((a, b) => b.seq - a.seq);
  if (role === "worker") return list.filter((j) => j.workerId === workerId);
  return list.filter((j) => j.clientId === userId);
}

module.exports = { create, get, update, pushSteps, all, forUser, dbReady };
