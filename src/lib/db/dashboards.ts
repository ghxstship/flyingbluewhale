import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  isDashboardLayout,
  type DashboardLayout,
  type DashboardRow,
  type DashboardWidget,
} from "@/lib/dashboards/types";
import type { ViewScope } from "@/lib/views/types";

/**
 * Server helpers for the `dashboards` table — Phase 3.6c keystone of the
 * SmartSuite parity roadmap. Reads/writes are RLS-gated by the caller's
 * cookie session, so callers never pass `userId` — Postgres decides what's
 * visible. Mirrors the shape of `view-configs.ts` (P3.1).
 */

/**
 * `dashboards` is a brand-new table not yet in the generated Supabase
 * Database types — `npm run gen:types` will pick it up next build. Use a
 * loosely-typed query builder until then; RLS is the actual auth boundary.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type LooseSupabase = {
  from: (table: string) => {
    select: (cols?: string) => any;
    insert: (rows: Record<string, unknown> | Record<string, unknown>[]) => any;
    update: (row: Record<string, unknown>) => any;
    delete: () => any;
  };
  auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

type DashboardRecord = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  layout: DashboardLayout | null;
  scope: ViewScope;
  is_default: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

const EMPTY_LAYOUT: DashboardLayout = { cols: 12, gap: 16, widgets: [] };

function rowFrom(record: DashboardRecord): DashboardRow {
  const layout = isDashboardLayout(record.layout) ? record.layout : EMPTY_LAYOUT;
  return {
    id: record.id,
    orgId: record.org_id,
    name: record.name,
    description: record.description,
    layout,
    scope: record.scope,
    isDefault: record.is_default,
    createdBy: record.created_by,
    updatedBy: record.updated_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

/**
 * List all dashboards visible to the caller in the given org. RLS gates
 * the result: private dashboards by the caller, org dashboards in the
 * caller's org, plus public dashboards in the org.
 */
export async function listDashboards(opts: { orgId: string }): Promise<DashboardRow[]> {
  if (!opts.orgId) return [];
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await supabase
    .from("dashboards")
    .select("*")
    .eq("org_id", opts.orgId)
    .order("scope", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as DashboardRecord[]).map(rowFrom);
}

/** Fetch a single dashboard row. Returns null when not visible to caller. */
export async function getDashboard(opts: { id: string }): Promise<DashboardRow | null> {
  if (!opts.id) return null;
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await supabase.from("dashboards").select("*").eq("id", opts.id).maybeSingle();
  if (error) throw error;
  return data ? rowFrom(data as DashboardRecord) : null;
}

/**
 * Create a fresh dashboard. RLS rejects `org`/`public` inserts by callers
 * below manager. Returns the new row.
 */
export async function createDashboard(opts: {
  orgId: string;
  name: string;
  description?: string;
  scope?: ViewScope;
  layout?: DashboardLayout;
}): Promise<DashboardRow> {
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const payload = {
    org_id: opts.orgId,
    name: opts.name,
    description: opts.description ?? null,
    scope: opts.scope ?? "private",
    layout: (opts.layout ?? EMPTY_LAYOUT) as unknown as Record<string, unknown>,
    created_by: userId,
    updated_by: userId,
  };

  const { data, error } = await supabase.from("dashboards").insert(payload).select("*").single();
  if (error) throw error;
  return rowFrom(data as DashboardRecord);
}

/**
 * Replace a dashboard's layout. Used by `saveLayoutAction`. RLS gates the
 * update; locked-row semantics are not yet exposed (no `is_locked` column
 * on this table — admins can always update, owners can update their own).
 */
export async function updateDashboardLayout(opts: { id: string; layout: DashboardLayout }): Promise<DashboardRow> {
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const { data, error } = await supabase
    .from("dashboards")
    .update({
      layout: opts.layout as unknown as Record<string, unknown>,
      updated_by: userId,
    })
    .eq("id", opts.id)
    .select("*")
    .single();
  if (error) throw error;
  return rowFrom(data as DashboardRecord);
}

/** Update top-level metadata (name/description/scope) without touching
 *  the layout JSON. */
export async function updateDashboardMeta(opts: {
  id: string;
  name?: string;
  description?: string | null;
  scope?: ViewScope;
}): Promise<DashboardRow> {
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const patch: Record<string, unknown> = { updated_by: userId };
  if (opts.name !== undefined) patch.name = opts.name;
  if (opts.description !== undefined) patch.description = opts.description;
  if (opts.scope !== undefined) patch.scope = opts.scope;

  const { data, error } = await supabase.from("dashboards").update(patch).eq("id", opts.id).select("*").single();
  if (error) throw error;
  return rowFrom(data as DashboardRecord);
}

/** Delete a dashboard. RLS gates by created_by + role. */
export async function deleteDashboard(opts: { id: string }): Promise<void> {
  if (!opts.id) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("dashboards").delete().eq("id", opts.id);
  if (error) throw error;
}

/**
 * Add a widget to an existing dashboard's layout. Reads the row, mutates
 * the array, and writes the new layout back. Cheap enough for the editor;
 * collisions are caller's responsibility (the canvas snaps to an open slot
 * before invoking this).
 */
export async function addWidgetToDashboard(opts: { id: string; widget: DashboardWidget }): Promise<DashboardRow> {
  const current = await getDashboard({ id: opts.id });
  if (!current) throw new Error("Dashboard not found");
  const next: DashboardLayout = {
    ...current.layout,
    widgets: [...current.layout.widgets, opts.widget],
  };
  return updateDashboardLayout({ id: opts.id, layout: next });
}

/** Remove a widget by id from a dashboard's layout. */
export async function removeWidgetFromDashboard(opts: { id: string; widgetId: string }): Promise<DashboardRow> {
  const current = await getDashboard({ id: opts.id });
  if (!current) throw new Error("Dashboard not found");
  const next: DashboardLayout = {
    ...current.layout,
    widgets: current.layout.widgets.filter((w) => w.id !== opts.widgetId),
  };
  return updateDashboardLayout({ id: opts.id, layout: next });
}
