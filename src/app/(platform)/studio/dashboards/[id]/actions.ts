"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth";
import {
  addWidgetToDashboard,
  removeWidgetFromDashboard,
  updateDashboardLayout,
  updateDashboardMeta,
} from "@/lib/db/dashboards";
import { isDashboardLayout, type DashboardWidget } from "@/lib/dashboards/types";

/**
 * Server actions for the dashboard editor — Phase 3.6c.
 *
 * `saveLayoutAction` is the hot path: invoked (debounced) by the canvas
 * after every drag/drop or palette add. `addWidgetAction` and
 * `removeWidgetAction` are coarser-grained alternatives the editor falls
 * back to when no full-layout snapshot is available.
 */

export type State = { error?: string; ok?: true } | null;

const ScopeSchema = z.enum(["private", "org", "public"]);

const WidgetBaseSchema = z.object({
  id: z.string().min(1),
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  title: z.string().optional(),
});

const KpiSchema = WidgetBaseSchema.extend({
  type: z.literal("kpi"),
  label: z.string(),
  value: z.union([z.number(), z.string()]),
  sparkline: z.array(z.number()).optional(),
  accent: z.boolean().optional(),
  delta: z.object({ value: z.string(), positive: z.boolean().optional() }).optional(),
});

// Chart-config shape is rich; for now accept any record so we don't fork
// the chart-config schema. The chart renderer validates at render time.
const ChartSchema = WidgetBaseSchema.extend({
  type: z.literal("chart"),
  chartConfig: z.record(z.string(), z.unknown()),
  dataQuery: z.object({
    table: z.string(),
    filter: z.record(z.string(), z.unknown()).optional(),
    limit: z.number().int().positive().optional(),
  }),
});

const SavedViewSchema = WidgetBaseSchema.extend({
  type: z.literal("saved_view"),
  viewConfigId: z.string(),
  rowLimit: z.number().int().positive().optional(),
});

const MarkdownSchema = WidgetBaseSchema.extend({
  type: z.literal("markdown"),
  content: z.string(),
});

const WidgetSchema = z.discriminatedUnion("type", [KpiSchema, ChartSchema, SavedViewSchema, MarkdownSchema]);

const LayoutSchema = z.object({
  cols: z.number().int().positive(),
  gap: z.number().int().nonnegative(),
  widgets: z.array(WidgetSchema),
});

/**
 * Persist a full layout snapshot. Caller is the dashboard canvas; debounce
 * client-side so a flurry of drag events doesn't hammer the API.
 */
export async function saveLayoutAction(id: string, rawLayout: unknown): Promise<State> {
  const session = await requireSession();
  if (!id) return { error: "Missing dashboard id" };

  const parsed = LayoutSchema.safeParse(rawLayout);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid layout" };
  }
  if (!isDashboardLayout(parsed.data)) {
    return { error: "Invalid layout shape" };
  }

  await updateDashboardLayout({ id, orgId: session.orgId, layout: parsed.data });
  revalidatePath(`/studio/dashboards/${id}`);
  revalidatePath(`/studio/dashboards/${id}/edit`);
  return { ok: true };
}

/**
 * Append a single widget. Returns OK on success; the caller is expected
 * to refresh.
 */
export async function addWidgetAction(id: string, rawWidget: unknown): Promise<State> {
  const session = await requireSession();
  if (!id) return { error: "Missing dashboard id" };

  const parsed = WidgetSchema.safeParse(rawWidget);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid widget" };
  }

  await addWidgetToDashboard({ id, orgId: session.orgId, widget: parsed.data as DashboardWidget });
  revalidatePath(`/studio/dashboards/${id}`);
  revalidatePath(`/studio/dashboards/${id}/edit`);
  return { ok: true };
}

/** Remove a widget by id. */
export async function removeWidgetAction(id: string, widgetId: string): Promise<State> {
  const session = await requireSession();
  if (!id || !widgetId) return { error: "Missing id" };

  await removeWidgetFromDashboard({ id, orgId: session.orgId, widgetId });
  revalidatePath(`/studio/dashboards/${id}`);
  revalidatePath(`/studio/dashboards/${id}/edit`);
  return { ok: true };
}

/** Update the dashboard's name/description/scope. */
export async function updateMetaAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const id = String(fd.get("id") ?? "");
  if (!id) return { error: "Missing dashboard id" };

  const name = String(fd.get("name") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const scopeRaw = String(fd.get("scope") ?? "private");
  const scope = ScopeSchema.safeParse(scopeRaw);
  if (!scope.success) return { error: "Invalid scope" };
  if (!name) return { error: "Name is required" };

  await updateDashboardMeta({
    id,
    orgId: session.orgId,
    name,
    description: description || null,
    scope: scope.data,
  });
  revalidatePath(`/studio/dashboards/${id}`);
  revalidatePath(`/studio/dashboards/${id}/edit`);
  revalidatePath(`/studio/dashboards`);
  return { ok: true };
}
