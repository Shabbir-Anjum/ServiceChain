// POST /api/proof/upload — worker uploads a proof photo (multipart FormData).
// Stores it in the public `job-proofs` bucket via the service role and returns
// the public URL. Only the assigned worker (or admin) may upload for a job.
import { NextResponse } from "next/server";
import { requireRole } from "../../../../lib/auth";
const { supabase: svc } = require("../../../../lib/supabase.js");
const store = require("../../../../lib/jobstore.js");

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req) {
  try {
    const auth = await requireRole("worker", "admin");
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!svc) return NextResponse.json({ error: "storage not configured" }, { status: 500 });

    const form = await req.formData();
    const uuid = form.get("uuid");
    const file = form.get("file");
    if (!uuid || !file || typeof file === "string") {
      return NextResponse.json({ error: "uuid and file are required" }, { status: 400 });
    }

    const rec = await store.get(uuid);
    if (!rec) return NextResponse.json({ error: "job not found" }, { status: 404 });
    if (auth.profile.role === "worker" && rec.workerId !== auth.profile.id) {
      return NextResponse.json({ error: "not your job" }, { status: 403 });
    }

    if (!OK_TYPES.includes(file.type)) return NextResponse.json({ error: "image must be jpeg/png/webp/gif" }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > MAX_BYTES) return NextResponse.json({ error: "image too large (max 8MB)" }, { status: 400 });

    const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const path = `${uuid}/${Date.now()}.${ext}`;
    const { error: upErr } = await svc.storage.from("job-proofs").upload(path, buf, { contentType: file.type, upsert: true });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    const { data } = svc.storage.from("job-proofs").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
