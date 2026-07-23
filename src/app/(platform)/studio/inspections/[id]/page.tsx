import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { transitionInspection, setInspectionItemResult } from "./actions";
import { StatusForm } from "@/components/StatusForm";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const RESULT_TONE: Record<string, "muted" | "info" | "success" | "error"> = {
  pending: "muted",
  pass: "success",
  fail: "error",
  na: "info",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data: insp } = await supabase
    .from("inspections")
    .select("*, project:project_id(name)")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!insp) notFound();

  const { data: items } = await supabase.from("inspection_items").select("*").eq("inspection_id", id).order("position");

  const allItems = items ?? [];
  const totals = {
    pass: allItems.filter((i) => i.result === "pass").length,
    fail: allItems.filter((i) => i.result === "fail").length,
    na: allItems.filter((i) => i.result === "na").length,
    pending: allItems.filter((i) => i.result === "pending").length,
  };

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.inspections.detail.eyebrow", undefined, "Safety")}
        breadcrumbs={[
          { label: t("console.inspections.detail.breadcrumb", undefined, "Inspections"), href: "/studio/inspections" },
          { label: insp.code },
        ]}
        title={`${insp.code} — ${insp.name}`}
        subtitle={
          (insp.project as unknown as { name: string | null } | null)?.name ??
          t("console.inspections.detail.noProject", undefined, "No project")
        }
        action={
          <div className="flex items-center gap-2">
            <Badge variant="info">{toTitle(insp.inspection_state)}</Badge>
            <a
              href={`/studio/inspections/${insp.id}/edit`}
              className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
            >
              {t("common.edit", undefined, "Edit")}
            </a>
            {insp.inspection_state === "scheduled" && (
              <StatusForm
                action={transitionInspection.bind(null, id, "in_progress")}
                label={t("console.inspections.detail.start", undefined, "Start")}
              />
            )}
            {insp.inspection_state === "in_progress" && totals.fail === 0 && (
              <StatusForm
                action={transitionInspection.bind(null, id, "passed")}
                label={t("console.inspections.detail.pass", undefined, "Pass")}
              />
            )}
            {insp.inspection_state === "in_progress" && (
              <StatusForm
                action={transitionInspection.bind(null, id, "failed")}
                label={t("console.inspections.detail.fail", undefined, "Fail")}
              />
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="grid gap-3 md:grid-cols-4">
          <div className="surface p-3 text-center">
            <div className="text-2xl font-semibold">{totals.pass}</div>
            <div className="text-xs text-[var(--p-text-2)]">
              {t("console.inspections.detail.totals.pass", undefined, "Pass")}
            </div>
          </div>
          <div className="surface p-3 text-center">
            <div className="text-2xl font-semibold">{totals.fail}</div>
            <div className="text-xs text-[var(--p-text-2)]">
              {t("console.inspections.detail.totals.fail", undefined, "Fail")}
            </div>
          </div>
          <div className="surface p-3 text-center">
            <div className="text-2xl font-semibold">{totals.na}</div>
            <div className="text-xs text-[var(--p-text-2)]">
              {t("console.inspections.detail.totals.na", undefined, "N/A")}
            </div>
          </div>
          <div className="surface p-3 text-center">
            <div className="text-2xl font-semibold">{totals.pending}</div>
            <div className="text-xs text-[var(--p-text-2)]">
              {t("console.inspections.detail.totals.pending", undefined, "Pending")}
            </div>
          </div>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">{t("console.inspections.detail.checklist", undefined, "Checklist")}</h3>
          {allItems.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "console.inspections.detail.emptyChecklist",
                undefined,
                "No checklist items. Was a template attached?",
              )}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {allItems.map((it) => (
                <li key={it.id} className="surface-inset p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex-1">
                      {it.position + 1}. {it.prompt}
                    </span>
                    <Badge variant={RESULT_TONE[it.result] ?? "muted"}>{it.result}</Badge>
                  </div>
                  {insp.inspection_state === "in_progress" && (
                    <div className="mt-2 flex gap-1.5">
                      {(["pass", "fail", "na"] as const).map((r) => (
                        <form key={r} action={setInspectionItemResult.bind(null, id, it.id, r)}>
                          <button
                            className="ps-btn ps-btn--ghost ps-btn--sm"
                            type="submit"
                          >
                            {r.toUpperCase()}
                          </button>
                        </form>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <ConversationPanel orgId={session.orgId} recordType="inspection" recordId={id} />
      </div>
    </>
  );
}
