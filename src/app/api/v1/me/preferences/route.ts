import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const PatchSchema = z.object({
  // Theme slugs — mirrors src/app/theme/themes.config.ts#ThemeSlug + the
  // "system" sentinel. The platform ships exactly one skin (`atlvs-product`);
  // the retired cosmic `ghxstship` skin and pre-v3 CHROMA themes are gone.
  // Stored rows carrying a dead slug fall back to the default on read.
  //
  // light/dark is the orthogonal `data-mode` attribute on <html>, not
  // stored here.
  theme: z.enum(["atlvs-product", "system"]).optional(),
  density: z.enum(["compact", "cozy", "spacious"]).optional(),
  locale: z.string().min(2).max(8).optional(),
  timezone: z.string().min(1).max(64).optional(),
  consent: z.record(z.string(), z.boolean()).optional(),
  table_views: z.record(z.string(), z.unknown()).optional(),
  last_org_id: z.string().uuid().nullable().optional(),
  // UI state additions — merged into ui_state jsonb
  palette_recents: z.array(z.string()).max(20).optional(),
  sidebar_width: z.number().int().min(56).max(480).optional(),
  sidebar_pinned: z.array(z.string()).max(30).optional(),
  sidebar_collapsed: z.boolean().optional(),
  // Sidebar expanded-group allow-list — written by PlatformSidebar since the
  // collapse-by-default pass but missing here until v7.8, so toggles never
  // actually persisted across sessions.
  sidebar_expanded_groups: z.array(z.string()).max(30).optional(),
  // v7.8 Role Lens — persona preset over the platform rail groups.
  nav_lens: z.enum(["All", "Produce", "Ops", "Crew", "Finance", "Safety"]).optional(),
  // ADR-0009: persisted mobile role for persona-routed COMPVSS.
  mobile_role: z.enum(["performer", "crew", "driver", "medic", "guard", "admin"]).optional(),
  // ADR-0007: last-visited portal slug for the app switcher's GVTEWAY entry.
  last_portal_slug: z.string().min(1).max(64).optional(),
  // Kit 20 fixture 01 — Show-Day Mode: flips the console home into the
  // live-ops strip (countdown, scans, incidents, crew on site).
  show_day_mode: z.boolean().optional(),
  // Kit 32 A4 — COMPVSS saved jobs (job_postings ids bookmarked on /m/jobs).
  saved_jobs: z.array(z.string().uuid()).max(200).optional(),
});

const UI_STATE_KEYS = [
  "palette_recents",
  "sidebar_width",
  "sidebar_pinned",
  "sidebar_collapsed",
  "sidebar_expanded_groups",
  "nav_lens",
  "mobile_role",
  "last_portal_slug",
  "show_day_mode",
  "saved_jobs",
] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return apiError("unauthorized", "Sign in required");

  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", u.user.id).maybeSingle();

  if (error) return apiError("internal", error.message);

  // Flatten ui_state into the top-level response shape
  const uiState = (data?.ui_state as Record<string, unknown> | null) ?? {};
  const flat = data ? { ...data, ...uiState } : null;

  return apiOk(flat);
}

export async function PATCH(req: NextRequest) {
  const parsed = await parseJson(req, PatchSchema);
  if (parsed instanceof NextResponse) return parsed;

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return apiError("unauthorized", "Sign in required");

  // Read existing row so we merge ui_state fields non-destructively
  const { data: existing } = await supabase
    .from("user_preferences")
    .select("ui_state")
    .eq("user_id", u.user.id)
    .maybeSingle();

  // Partition incoming fields
  const patch: Record<string, unknown> = {};
  const uiPatch: Record<string, unknown> = { ...((existing?.ui_state as Record<string, unknown> | null) ?? {}) };
  for (const [k, v] of Object.entries(parsed)) {
    if ((UI_STATE_KEYS as readonly string[]).includes(k)) {
      uiPatch[k] = v;
    } else {
      patch[k] = v;
    }
  }
  if (parsed.consent) patch.consent = parsed.consent as Json;
  if (parsed.table_views) patch.table_views = parsed.table_views as Json;
  patch.ui_state = uiPatch as Json;

  const upsertRow = { user_id: u.user.id, ...patch };
  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(upsertRow, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return apiError("internal", error.message);
  const uiState = (data.ui_state as Record<string, unknown> | null) ?? {};
  return apiOk({ ...data, ...uiState });
}
