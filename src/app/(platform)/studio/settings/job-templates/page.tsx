import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { timeAgo } from "@/lib/format";
import { createWorkOrderFromTemplate } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  trade: string | null;
  template_state: string;
  last_used_at: string | null;
  steps: { count: number }[] | null;
};

export default async function JobTemplatesPage() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("job_templates")
    .select("id, name, trade, template_state, last_used_at, steps:job_template_steps(count)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.jobTemplates.eyebrow", undefined, "Settings")}
        title={t("console.settings.jobTemplates.title", undefined, "Job Templates")}
        subtitle={t(
          "console.settings.jobTemplates.subtitle",
          undefined,
          "Reusable scope checklists that seed a work order's task list when a sub is awarded.",
        )}
      />
      <div className="mb-6 flex justify-end">
        <Button href="/studio/settings/job-templates/new">
          {t("console.settings.jobTemplates.new", undefined, "New Template")}
        </Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          title={t("console.settings.jobTemplates.empty", undefined, "No job templates yet")}
          description={t(
            "console.settings.jobTemplates.emptyBody",
            undefined,
            "Create a reusable checklist (e.g. a rigging or electrical scope) to standardize what each awarded crew delivers.",
          )}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id} className="surface flex items-center gap-3 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.name}</span>
                  {r.trade && <Badge variant="muted">{r.trade}</Badge>}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-[var(--p-text-3)]">
                  {r.last_used_at
                    ? t(
                        "console.settings.jobTemplates.lastUsed",
                        { when: timeAgo(r.last_used_at) },
                        `Last used ${timeAgo(r.last_used_at)}`,
                      )
                    : t("console.settings.jobTemplates.neverUsed", undefined, "Never used")}
                </div>
              </div>
              <span className="font-mono text-xs text-[var(--p-text-2)]">
                {(r.steps?.[0]?.count ?? 0)} {t("console.settings.jobTemplates.steps", undefined, "steps")}
              </span>
              <form action={createWorkOrderFromTemplate.bind(null, r.id)}>
                <button type="submit" className="ps-btn ps-btn--secondary ps-btn--sm">
                  {t("console.settings.jobTemplates.createWorkOrder", undefined, "Create Work Order")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
