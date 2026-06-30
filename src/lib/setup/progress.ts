import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * SetupChecklist activation / time-to-value model (v7.7).
 *
 * The activation chain is DERIVED live from real org data — never stored — so it
 * can't drift from reality: create a project → import data → invite the team →
 * go live. Each step is a cheap head-count against an org-scoped table; a step is
 * `done` once its signal exists. Missing tables degrade to `done:false` (never throw)
 * so the checklist is safe on a partially-migrated org.
 */
export type SetupStepId = "create_project" | "import_data" | "invite_team" | "go_live";

export type SetupStep = {
  id: SetupStepId;
  /** Dotted i18n key; caller resolves with a fallback. */
  labelKey: string;
  fallbackLabel: string;
  /** Where the step's primary action lives (platform-shell path). */
  href: string;
  done: boolean;
};

export type SetupProgress = {
  steps: SetupStep[];
  /** Count of completed steps. */
  completed: number;
  total: number;
  /** True once every step is satisfied (the checklist self-retires). */
  complete: boolean;
};

// Dynamic table names (the count helpers take the table as a value), so the
// typed client can't resolve the column types — use the loose wrapper per the
// repo's sanctioned escape hatch. RLS is still the authorization boundary.
type Client = LooseSupabase;

/** Org-scoped exact head-count; any failure (missing table, RLS) → 0. */
async function countOrgRows(supabase: Client, table: string, orgId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId);
    return error ? 0 : (count ?? 0);
  } catch {
    return 0;
  }
}

/** Active (non-soft-deleted) memberships in the org. */
async function countMembers(supabase: Client, orgId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .is("deleted_at", null);
    return error ? 0 : (count ?? 0);
  } catch {
    return 0;
  }
}

export async function getSetupProgress(orgId: string): Promise<SetupProgress> {
  const supabase = (await createClient()) as unknown as LooseSupabase;

  // Run the four signals concurrently — each is a head-only count.
  const [projects, imports, members, guides, invoices] = await Promise.all([
    countOrgRows(supabase, "projects", orgId),
    countOrgRows(supabase, "import_jobs", orgId),
    countMembers(supabase, orgId),
    countOrgRows(supabase, "event_guides", orgId),
    countOrgRows(supabase, "invoices", orgId),
  ]);

  const steps: SetupStep[] = [
    {
      id: "create_project",
      labelKey: "console.setup.createProject",
      fallbackLabel: "Create your first project",
      href: "/studio/projects/new",
      done: projects > 0,
    },
    {
      id: "import_data",
      labelKey: "console.setup.importData",
      fallbackLabel: "Import your existing data",
      href: "/studio/import",
      done: imports > 0,
    },
    {
      id: "invite_team",
      labelKey: "console.setup.inviteTeam",
      fallbackLabel: "Invite your team",
      href: "/studio/settings/members",
      // The owner is always a member; a second membership means a real invite.
      done: members > 1,
    },
    {
      id: "go_live",
      labelKey: "console.setup.goLive",
      fallbackLabel: "Go live",
      href: "/studio/projects",
      // A published audience guide or a first invoice = the org is operating.
      done: guides > 0 || invoices > 0,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  return { steps, completed, total: steps.length, complete: completed === steps.length };
}
