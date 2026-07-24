import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { log } from "@/lib/log";
import type { TemplateFamily } from "./library-shared";

/**
 * Template version history (template-management program, 2026-07-24).
 *
 * One generic append-only journal (`template_versions`, migration
 * 20260724134606) for every row-backed template store: `family` matches the
 * unified library vocabulary, `snapshot` is the store's content columns at
 * that version. Write paths call this AFTER a successful create/update so a
 * template edit is never silently unrecoverable.
 *
 * Best-effort by design: versioning must never fail the underlying write, so
 * errors are logged and swallowed. The insert races are harmless — the unique
 * (org, family, template, version) constraint drops the loser and the next
 * write picks the true max.
 */
export async function recordTemplateVersion(
  supabase: SupabaseClient<Database>,
  opts: {
    orgId: string;
    family: TemplateFamily;
    templateId: string;
    snapshot: Record<string, unknown>;
    changedBy?: string | null;
  },
): Promise<void> {
  try {
    const { data: latest } = await supabase
      .from("template_versions")
      .select("version")
      .eq("org_id", opts.orgId)
      .eq("family", opts.family)
      .eq("template_id", opts.templateId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const next = (latest?.version ?? 0) + 1;
    const { error } = await supabase.from("template_versions").insert({
      org_id: opts.orgId,
      family: opts.family,
      template_id: opts.templateId,
      version: next,
      snapshot: opts.snapshot as Json,
      changed_by: opts.changedBy ?? null,
    });
    if (error) log.warn("templates.version_record_failed", { err: error.message, family: opts.family });
  } catch (err) {
    log.warn("templates.version_record_failed", {
      err: err instanceof Error ? err.message : String(err),
      family: opts.family,
    });
  }
}
