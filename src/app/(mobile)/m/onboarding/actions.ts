"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { isNewHireStepDone, type NewHireStepProgress } from "@/lib/workforce";
import { log } from "@/lib/log";

/**
 * Onboarding step completion (KIT28 §3 item 5 · manifest `onboard.complete`).
 *
 * Every step used to complete through one blanket self-attest write —
 * `progress[stepId] = true` — regardless of what the step asked for. The
 * branched kinds now demand their artifact server-side:
 *
 *   upload → `completeUploadStep` (a real file, stored + recorded)
 *   sign   → `completeSignStep` (drawn PNG and/or typed name)
 *   read   → `completeStep` behind a client scroll-gate (the server cannot
 *            verify scrolling; the gate is UX, the attest is still honest)
 *   quiz / course / form → `completeStep` (the existing attest flow, until
 *            those kinds get their own machines)
 *
 * `completeStep` REJECTS upload/sign so a hand-rolled POST can't tick past
 * the artifact requirement.
 *
 * ARTIFACTS GO TO `personal-documents` VIA THE SERVICE CLIENT, deliberately:
 * that bucket has no caller-client INSERT policy (see migration
 * 20260715151212 — it is written only through the service client), and this
 * follows the existing `uploadPersonalDoc` precedent rather than widening
 * the bucket's RLS. The path keeps the `{org}/{user}/…` layout that
 * `storage_org_scoped_read` expects, so a future flip to caller uploads
 * already complies. Each upload also inserts a `personal_documents` row so
 * the artifact is visible (and signable for download) in My Documents.
 */

const StepSchema = z.object({
  assignmentId: z.string().uuid(),
  stepId: z.string().uuid(),
});

export type State = { error?: string } | null;

type OwnAssignment = {
  id: string;
  org_id: string;
  flow_id: string;
  progress: Record<string, NewHireStepProgress> | null;
  started_at: string | null;
  assignment_phase: string;
};

type FlowStep = { id: string; title: string; step_kind: string };

/** The caller's own assignment, or null. Self-scoped — never someone else's. */
async function loadOwnAssignment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assignmentId: string,
  userId: string,
): Promise<OwnAssignment | null> {
  const { data } = await supabase
    .from("new_hire_assignments")
    .select("id, org_id, flow_id, progress, started_at, assignment_phase")
    .eq("id", assignmentId)
    .eq("assignee_id", userId)
    .maybeSingle();
  return (data as OwnAssignment | null) ?? null;
}

/** The step, verified to belong to the assignment's flow. */
async function loadFlowStep(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stepId: string,
  flowId: string,
): Promise<FlowStep | null> {
  const { data } = await supabase
    .from("new_hire_flow_steps")
    .select("id, title, step_kind")
    .eq("id", stepId)
    .eq("flow_id", flowId)
    .maybeSingle();
  return (data as FlowStep | null) ?? null;
}

/** Write the progress tick + phase bump shared by every completion path. */
async function saveProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  a: OwnAssignment,
  stepId: string,
  value: NewHireStepProgress,
): Promise<State> {
  const progress = { ...(a.progress ?? {}), [stepId]: value };
  const { error } = await supabase
    .from("new_hire_assignments")
    .update({
      progress,
      assignment_phase: a.assignment_phase === "not_started" ? "in_progress" : a.assignment_phase,
      started_at: a.started_at ?? new Date().toISOString(),
    })
    .eq("id", a.id);
  if (error) return { error: `Could not save step progress: ${error.message}` };

  revalidatePath(`/m/onboarding/${a.id}`);
  revalidatePath("/m/onboarding");
  return null;
}

export async function completeStep(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = StepSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  const a = await loadOwnAssignment(supabase, parsed.data.assignmentId, session.userId);
  if (!a) return { error: "Onboarding assignment not found" };

  const step = await loadFlowStep(supabase, parsed.data.stepId, a.flow_id);
  if (!step) return { error: "Step not found in this flow" };

  // The artifact kinds cannot be self-attested past — a tampered form must
  // not skip the file or the ink.
  if (step.step_kind === "upload") return { error: "This step needs a file. Use the upload control." };
  if (step.step_kind === "sign") return { error: "This step needs a signature. Use the signing control." };

  return saveProgress(supabase, a, step.id, true);
}

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB — matches uploadPersonalDoc.

export async function completeUploadStep(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isServiceClientAvailable()) {
    return { error: "Uploads are unavailable right now. Try again later." };
  }

  // Scalars only — Object.fromEntries would stringify the File.
  const scalars = Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string"));
  const parsed = StepSchema.safeParse(scalars);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "That file is too large (20 MB limit)." };

  const supabase = await createClient();
  const a = await loadOwnAssignment(supabase, parsed.data.assignmentId, session.userId);
  if (!a) return { error: "Onboarding assignment not found" };
  if (a.assignment_phase === "completed") return { error: "This onboarding is already complete." };

  const step = await loadFlowStep(supabase, parsed.data.stepId, a.flow_id);
  if (!step) return { error: "Step not found in this flow" };
  if (step.step_kind !== "upload") return { error: "This step does not take a file." };

  // Upload BEFORE the tick: a completed step whose artifact vanished is the
  // exact dishonesty this action replaces.
  const safeName = (file.name || "document").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const storagePath = `${a.org_id}/${session.userId}/${Date.now()}-${safeName}`;
  const service = createServiceClient();
  const { error: upErr } = await service.storage
    .from("personal-documents")
    .upload(storagePath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || "application/octet-stream",
      cacheControl: "private, max-age=0",
      upsert: false,
    });
  if (upErr) {
    log.error("m.onboarding.upload_failed", { err: upErr.message });
    return { error: "Upload failed. Check your connection and try again." };
  }

  // Record it as a personal document so it is findable and downloadable in
  // My Documents — the step tick alone would strand the file in storage.
  const { error: docErr } = await supabase.from("personal_documents").insert({
    org_id: a.org_id,
    user_id: session.userId,
    label: `Onboarding: ${step.title}`.slice(0, 200),
    doc_kind: "other",
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size,
  });
  if (docErr) {
    // Not fatal to the step — the artifact exists and progress records its
    // path — but say so in the log; the My Documents listing will miss it.
    log.error("m.onboarding.personal_doc_insert_failed", { err: docErr.message });
  }

  return saveProgress(supabase, a, step.id, { done: true, kind: "upload", path: storagePath });
}

const MAX_SIGNATURE_CHARS = 2_000_000; // ~1.5MB of PNG — same ceiling as /sign/[token].

const SignSchema = StepSchema.extend({
  signature: z.string().startsWith("data:image/png;base64,").max(MAX_SIGNATURE_CHARS).optional().or(z.literal("")),
  // The keyboard / assistive-tech alternative — a freehand canvas must never
  // be the only way to sign (SignaturePad's own a11y rule).
  typedName: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function completeSignStep(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = SignSchema.safeParse(Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return { error: "Could not read the signature. Try again." };
  const v = parsed.data;

  const signature = v.signature || null;
  const typedName = v.typedName?.trim() || null;
  if (!signature && !typedName) return { error: "Draw your signature or type your full name first." };

  const supabase = await createClient();
  const a = await loadOwnAssignment(supabase, v.assignmentId, session.userId);
  if (!a) return { error: "Onboarding assignment not found" };
  if (a.assignment_phase === "completed") return { error: "This onboarding is already complete." };

  const step = await loadFlowStep(supabase, v.stepId, a.flow_id);
  if (!step) return { error: "Step not found in this flow" };
  if (step.step_kind !== "sign") return { error: "This step does not take a signature." };

  // Drawn ink is stored as an artifact; unlike a briefing sign-in there is no
  // perishable attendance to salvage, so a failed upload is an error the
  // person retries, not a warning.
  let signaturePath: string | null = null;
  if (signature) {
    if (!isServiceClientAvailable()) return { error: "Signing is unavailable right now. Try again later." };
    const bytes = Buffer.from(signature.slice("data:image/png;base64,".length), "base64");
    if (bytes.byteLength === 0) return { error: "That signature came through empty. Sign again." };
    const storagePath = `${a.org_id}/${session.userId}/${Date.now()}-signature.png`;
    const service = createServiceClient();
    const { error: upErr } = await service.storage.from("personal-documents").upload(storagePath, bytes, {
      contentType: "image/png",
      cacheControl: "private, max-age=0",
      upsert: false,
    });
    if (upErr) {
      log.error("m.onboarding.signature_upload_failed", { err: upErr.message });
      return { error: "The signature could not be saved. Try again." };
    }
    signaturePath = storagePath;

    const { error: docErr } = await supabase.from("personal_documents").insert({
      org_id: a.org_id,
      user_id: session.userId,
      label: `Signature: ${step.title}`.slice(0, 200),
      doc_kind: "other",
      storage_path: storagePath,
      mime_type: "image/png",
      size_bytes: bytes.byteLength,
    });
    if (docErr) log.error("m.onboarding.signature_doc_insert_failed", { err: docErr.message });
  }

  return saveProgress(supabase, a, step.id, {
    done: true,
    kind: "sign",
    path: signaturePath,
    signedAs: typedName,
  });
}

const FinalizeSchema = z.object({ assignmentId: z.string().uuid() });

export async function finalizeAssignment(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = FinalizeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  const a = await loadOwnAssignment(supabase, parsed.data.assignmentId, session.userId);
  if (!a) return { error: "Onboarding assignment not found" };

  // Verify every required step is done — re-check on the server so a
  // tampered form can't skip required steps.
  const { data: steps } = await supabase.from("new_hire_flow_steps").select("id, required").eq("flow_id", a.flow_id);
  const progress = (a.progress ?? {}) as Record<string, NewHireStepProgress>;
  const requiredDone = ((steps ?? []) as Array<{ id: string; required: boolean }>)
    .filter((s) => s.required)
    .every((s) => isNewHireStepDone(progress[s.id]));
  if (!requiredDone) return { error: "Complete every required step before finishing" };

  const { error } = await supabase
    .from("new_hire_assignments")
    .update({ assignment_phase: "completed", completed_at: new Date().toISOString() })
    .eq("id", parsed.data.assignmentId)
    .neq("assignment_phase", "completed");
  if (error) return { error: `Could not finalize onboarding: ${error.message}` };

  revalidatePath(`/m/onboarding/${parsed.data.assignmentId}`);
  revalidatePath("/m/onboarding");
  return null;
}
