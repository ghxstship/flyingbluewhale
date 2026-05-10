import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SavedView, ViewConfigRow, ViewScope, ViewType } from "@/lib/views/types";
import type { Json } from "@/lib/supabase/database.types";

/**
 * `view_configs` is a brand-new table not yet in the generated Supabase
 * Database types — `npm run gen:types` will pick it up next build. Until
 * view_configs is now in the regenerated database.types — the typed
 * Supabase client handles it directly. The legacy LooseSupabase shim
 * was deleted as part of the F1 refresh.
 */

/**
 * Server helpers for the `view_configs` table — Phase 3.1 keystone of the
 * SmartSuite parity roadmap. Reads/writes are RLS-gated by the caller's
 * cookie session, so these helpers never accept a `userId` argument:
 * Postgres decides what the caller can see.
 *
 * The existing `user_preferences.table_views` write path is preserved
 * untouched as the implicit per-user "unsaved working copy" — these
 * helpers are a NEW layer on top.
 */

type ViewConfigRecord = {
  id: string;
  org_id: string;
  table_id: string;
  type: ViewType;
  scope: ViewScope;
  name: string;
  description: string | null;
  config: SavedView | null;
  is_default: boolean;
  is_locked: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

function rowFrom(record: ViewConfigRecord): ViewConfigRow {
  return {
    id: record.id,
    orgId: record.org_id,
    tableId: record.table_id,
    type: record.type,
    scope: record.scope,
    name: record.name,
    description: record.description,
    config: (record.config ?? {}) as SavedView,
    isDefault: record.is_default,
    isLocked: record.is_locked,
    createdBy: record.created_by,
    updatedBy: record.updated_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

/**
 * List all saved views the caller can see for a given table. RLS gates
 * the result: private views by the caller, org views in the caller's org,
 * and public views in the caller's org.
 */
export async function listViewConfigs(opts: { orgId: string; tableId: string }): Promise<ViewConfigRow[]> {
  if (!opts.orgId || !opts.tableId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("view_configs")
    .select("*")
    .eq("org_id", opts.orgId)
    .eq("table_id", opts.tableId)
    .order("scope", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as ViewConfigRecord[]).map(rowFrom);
}

/**
 * Fetch a single saved view by id. Returns `null` when the row is not
 * visible to the caller (RLS) or doesn't exist.
 */
export async function getViewConfig(opts: { id: string }): Promise<ViewConfigRow | null> {
  if (!opts.id) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("view_configs").select("*").eq("id", opts.id).maybeSingle();
  if (error) throw error;
  return data ? rowFrom(data as ViewConfigRecord) : null;
}

/**
 * Create or update a saved view. When `upsertById` is supplied the row is
 * updated in place; otherwise a new row is inserted. RLS will reject
 * inserts of `org`/`public` views by callers without owner/admin/manager
 * roles, and reject updates of locked rows by callers below owner/admin.
 */
export async function saveViewConfig(opts: {
  orgId: string;
  tableId: string;
  type: ViewType;
  scope: ViewScope;
  name: string;
  description?: string;
  config: SavedView;
  upsertById?: string;
  isDefault?: boolean;
  isLocked?: boolean;
}): Promise<ViewConfigRow> {
  const supabase = await createClient();

  // Pull the caller's user id so we can stamp `created_by` / `updated_by`.
  // RLS still does the actual gating; this is just provenance.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const payload = {
    org_id: opts.orgId,
    table_id: opts.tableId,
    type: opts.type,
    scope: opts.scope,
    name: opts.name,
    description: opts.description ?? null,
    config: opts.config as unknown as Json,
    is_default: opts.isDefault ?? false,
    is_locked: opts.isLocked ?? false,
    updated_by: userId,
  };

  if (opts.upsertById) {
    const { data, error } = await supabase
      .from("view_configs")
      .update(payload)
      .eq("id", opts.upsertById)
      .select("*")
      .single();
    if (error) throw error;
    return rowFrom(data as ViewConfigRecord);
  }

  const { data, error } = await supabase
    .from("view_configs")
    .insert({ ...payload, created_by: userId })
    .select("*")
    .single();
  if (error) throw error;
  return rowFrom(data as ViewConfigRecord);
}

/**
 * Delete a saved view by id. RLS gates whether the caller can delete:
 * the row's `created_by` and org owners/admins are allowed.
 */
export async function deleteViewConfig(opts: { id: string }): Promise<void> {
  if (!opts.id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("view_configs").delete().eq("id", opts.id);
  if (error) throw error;
}

/**
 * Mark a saved view as the default for its (org_id, table_id, scope).
 * Clears `is_default` on sibling rows in the same scope so only one
 * row is the default at a time.
 */
export async function setDefaultView(opts: { id: string }): Promise<void> {
  if (!opts.id) return;
  const supabase = await createClient();

  // Look up the row first so we know its org/table/scope.
  const target = await getViewConfig({ id: opts.id });
  if (!target) return;

  const { error: clearErr } = await supabase
    .from("view_configs")
    .update({ is_default: false })
    .eq("org_id", target.orgId)
    .eq("table_id", target.tableId)
    .eq("scope", target.scope);
  if (clearErr) throw clearErr;

  const { error: setErr } = await supabase.from("view_configs").update({ is_default: true }).eq("id", opts.id);
  if (setErr) throw setErr;
}
