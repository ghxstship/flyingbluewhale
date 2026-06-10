import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { stampRevision, addNextRound, closeSubmittal } from "./actions";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  submitted: "info",
  in_review: "info",
  approved: "success",
  approved_with_comments: "success",
  revise_resubmit: "warning",
  rejected: "error",
  void: "muted",
  closed: "muted",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data: sub } = await supabase
    .from("submittals")
    .select("*, project:project_id(name), vendor:vendor_id(name), ball:ball_in_court_id(name, email)")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!sub) notFound();

  const { data: revisions } = await supabase
    .from("submittal_revisions")
    .select("*")
    .eq("submittal_id", id)
    .order("round", { ascending: true });

  const all = revisions ?? [];
  const current = all.find((r) => r.round === sub.current_round);
  const project = (sub.project as unknown as { name: string | null } | null)?.name ?? "—";
  const noSpecSection = t("console.submittals.detail.noSpecSection", undefined, "No Spec Section");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.submittals.detail.eyebrow", undefined, "Procurement")}
        breadcrumbs={[
          { label: t("console.submittals.detail.breadcrumb", undefined, "Submittals"), href: "/console/submittals" },
          { label: sub.code },
        ]}
        title={`${sub.code} — ${sub.title}`}
        subtitle={t(
          "console.submittals.detail.subtitle",
          { project, spec: sub.spec_section ?? noSpecSection, round: sub.current_round },
          `${project} · ${sub.spec_section ?? noSpecSection} · Round #${sub.current_round}`,
        )}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[sub.submittal_state] ?? "muted"}>{toTitle(sub.submittal_state)}</Badge>
            <a
              href={`/console/submittals/${sub.id}/edit`}
              className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
            >
              {t("common.edit", undefined, "Edit")}
            </a>
            {sub.submittal_state !== "closed" && sub.submittal_state !== "void" && (
              <form action={closeSubmittal.bind(null, id)}>
                <button className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium" type="submit">
                  {t("common.close", undefined, "Close")}
                </button>
              </form>
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.submittals.detail.revisionRounds", undefined, "Revision Rounds")}
          </h3>
          <table className="ps-table mt-3">
            <thead>
              <tr>
                <th>{t("console.submittals.detail.col.round", undefined, "Round")}</th>
                <th>{t("console.submittals.detail.col.submitted", undefined, "Submitted")}</th>
                <th>{t("console.submittals.detail.col.stamp", undefined, "Stamp")}</th>
                <th>{t("console.submittals.detail.col.stampNotes", undefined, "Stamp Notes")}</th>
              </tr>
            </thead>
            <tbody>
              {all.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">#{r.round}</td>
                  <td className="font-mono text-xs">{new Date(r.submitted_at).toLocaleDateString()}</td>
                  <td>
                    <Badge variant={STATUS_TONE[r.stamp] ?? "muted"}>{toTitle(r.stamp)}</Badge>
                  </td>
                  <td>{r.stamp_notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {current && current.stamp === "no_stamp" && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">
              {t("console.submittals.detail.stampRound", { round: current.round }, `Stamp Round #${current.round}`)}
            </h3>
            <form action={stampRevision.bind(null, id, current.id)} className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-[var(--p-text-2)]">
                    {t("console.submittals.detail.col.stamp", undefined, "Stamp")}
                  </span>
                  <select name="stamp" required className={INPUT}>
                    <option value="approved">
                      {t("console.submittals.detail.stamp.approved", undefined, "Approved")}
                    </option>
                    <option value="approved_with_comments">
                      {t("console.submittals.detail.stamp.approvedWithComments", undefined, "Approved With Comments")}
                    </option>
                    <option value="revise_resubmit">
                      {t("console.submittals.detail.stamp.reviseResubmit", undefined, "Revise & Resubmit")}
                    </option>
                    <option value="rejected">
                      {t("console.submittals.detail.stamp.rejected", undefined, "Rejected")}
                    </option>
                  </select>
                </label>
              </div>
              <textarea
                name="stamp_notes"
                rows={3}
                placeholder={t("console.submittals.detail.reviewerNotesPlaceholder", undefined, "Reviewer notes…")}
                className={INPUT}
              />
              <div className="flex justify-end">
                <button type="submit" className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium">
                  {t("console.submittals.detail.applyStamp", undefined, "Apply Stamp")}
                </button>
              </div>
            </form>
          </section>
        )}

        {current && current.stamp === "revise_resubmit" && (
          <section className="surface p-4">
            <form action={addNextRound.bind(null, id)}>
              <button type="submit" className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium">
                {t(
                  "console.submittals.detail.openRound",
                  { round: sub.current_round + 1 },
                  `+ Open Round #${sub.current_round + 1}`,
                )}
              </button>
            </form>
          </section>
        )}

        <ConversationPanel orgId={session.orgId} recordType="submittal" recordId={id} />
      </div>
    </>
  );
}
