"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

/**
 * Shared `uploadPersonalDoc` action (ADR-0008 Amendment 4).
 *
 * Lifted from `src/app/(mobile)/m/docs/actions.ts`. Worth stating plainly,
 * because "upload" reads like a camera flow and camera is one of the three
 * field capabilities that would pin a write to COMPVSS: this one is NOT
 * camera-bound. The mobile form deliberately ships **no `capture`
 * attribute** — it is a plain `<input type="file" accept="image/*,application/pdf">`
 * and lets the OS picker offer camera *or* files. That is a file picker, not
 * a sensor, and every desktop browser has one. So under the capability rule
 * (`shell-contract.ts`) this belongs in both shells.
 *
 * Callers pass `revalidate` + `redirectTo` so each shell returns to its own
 * document list. `signDocumentUrl` stays in the mobile module: it is already
 * consumed cross-shell via `DocDownloadLink`, which `DocsSurface` imports
 * regardless of where it's mounted.
 */

const Schema = z.object({
  label: z.string().min(1).max(200),
  doc_kind: z.enum(["id", "license", "tax", "contract", "medical", "other"]),
  revalidate: z.string().min(1).max(200),
  redirectTo: z.string().min(1).max(200),
});

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB — covers a passport scan, PDF contract, etc.

export type State = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function uploadPersonalDoc(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isServiceClientAvailable()) {
    return actionFail("Uploads are unavailable right now. Try again later.", fd);
  }

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return actionFail("Choose a file to upload.", fd);
  const f = file as File;
  if (f.size > MAX_SIZE_BYTES) return actionFail("That file is too large. The limit is 20 MB.", fd);

  const parsed = Schema.safeParse({
    label: fd.get("label"),
    doc_kind: fd.get("doc_kind"),
    revalidate: fd.get("revalidate"),
    redirectTo: fd.get("redirectTo"),
  });
  if (!parsed.success) return formFail(parsed.error, fd);

  // Path is {org_id}/{user_id}/{timestamp}-{sanitized-filename}. Matches
  // migration 0045 storage RLS (path[1] must be a member-org). The
  // service-role client bypasses RLS, but we still maintain the layout
  // so a future migration can flip the bucket to user-uploads and the
  // path layout will already comply.
  const safeName = (f.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const storagePath = `${session.orgId}/${session.userId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await f.arrayBuffer());

  const service = createServiceClient();
  const { error: uploadErr } = await service.storage.from("personal-documents").upload(storagePath, buffer, {
    contentType: f.type || "application/octet-stream",
    cacheControl: "private, max-age=0",
    upsert: false,
  });
  if (uploadErr) return actionFail("Upload failed. Check your connection and try again.", fd);

  const supabase = await createClient();
  const { error } = await supabase.from("personal_documents").insert({
    org_id: session.orgId,
    user_id: session.userId,
    label: parsed.data.label,
    doc_kind: parsed.data.doc_kind,
    storage_path: storagePath,
    mime_type: f.type || null,
    size_bytes: f.size,
  });
  if (error) return actionFail(`Could not save document record: ${error.message}`, fd);

  revalidatePath(parsed.data.revalidate);
  redirect(parsed.data.redirectTo);
}
