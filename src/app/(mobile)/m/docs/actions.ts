"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

/**
 * Personal-document download signing.
 *
 * `uploadPersonalDoc` moved to `src/components/workforce/docs-action.ts` in
 * ADR-0008 Amendment 4 — the portal needed to upload too, and the write has
 * no field-capability dependency (the file input carries no `capture`), so
 * under the capability rule it belongs in both shells.
 *
 * The signer stays here: it is already reached cross-shell through
 * `DocDownloadLink`, which `DocsSurface` imports from this module no matter
 * which shell mounts it. Moving it would churn imports without changing a
 * boundary.
 */

const DownloadSchema = z.object({ id: z.string().uuid() });

export async function signDocumentUrl(input: { id: string }): Promise<string | null> {
  const session = await requireSession();
  if (!isServiceClientAvailable()) return null;
  const parsed = DownloadSchema.parse(input);
  const supabase = await createClient();

  // Self-owned docs only. RLS gates this too but the explicit check
  // returns null cleanly for UI fall-through.
  const { data: doc } = await supabase
    .from("personal_documents")
    .select("storage_path")
    .eq("id", parsed.id)
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) return null;

  const service = createServiceClient();
  const { data: signed } = await service.storage
    .from("personal-documents")
    .createSignedUrl((doc as { storage_path: string }).storage_path, 300);
  return signed?.signedUrl ?? null;
}
