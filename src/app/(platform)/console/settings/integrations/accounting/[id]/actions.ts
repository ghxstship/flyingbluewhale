"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SYNC_ENDPOINT } from "./sync-endpoints";

/**
 * Detail-page server actions for a single accounting connection.
 *
 * - `disconnectAccountingConnection` soft-deletes the row (mirrors the
 *   org-integrations uninstall pattern). NEVER touches auth_ciphertext in
 *   the UI; the secret column is left as-is on the soft-deleted row.
 * - `syncAccountingConnection` is a thin server-action wrapper over the
 *   EXISTING pull-side sync endpoints
 *   (`/api/v1/integrations/qb-online/sync` for QBO, the generic
 *   `/api/v1/integrations/[system]/sync` for Sage/Foundation/Vista). It
 *   re-uses the caller's session cookies so the endpoint's own withAuth +
 *   isAdmin guards apply.
 */

const IdSchema = z.object({ id: z.string().uuid() });

export async function disconnectAccountingConnection(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session)) return;
  const parsed = IdSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounting_connections")
    .update({ connection_state: "revoked", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not disconnect: ${error.message}`);
  revalidatePath("/console/settings/integrations/accounting");
}

export async function syncAccountingConnection(formData: FormData) {
  const session = await requireSession();
  if (!isAdmin(session)) return;
  const parsed = IdSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return;
  const supabase = await createClient();

  // Cross-tenant guard + resolve which endpoint handles this system.
  const { data } = await supabase
    .from("accounting_connections")
    .select("id, system")
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const conn = data as { id: string; system: string } | null;
  if (!conn) return;
  const endpoint = SYNC_ENDPOINT[conn.system];
  if (!endpoint) return;

  // The sync routes are authed API endpoints; forward the request with the
  // caller's cookies so their withAuth/isAdmin checks run server-side.
  const { cookies, headers } = await import("next/headers");
  const cookieStore = await cookies();
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  if (!host) return;
  const origin = `${proto}://${host}`;

  await fetch(`${origin}${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; "),
    },
    body: JSON.stringify({ connection_id: conn.id, entities: ["vendors", "accounts"] }),
    cache: "no-store",
  }).catch(() => undefined);

  revalidatePath(`/console/settings/integrations/accounting/${conn.id}`);
}
