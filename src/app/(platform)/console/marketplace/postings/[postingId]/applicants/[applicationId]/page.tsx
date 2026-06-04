import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { JOB_APPLICATION_STATUSES, STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { transitionApplicationAction } from "./actions";

export const dynamic = "force-dynamic";

type App = {
  id: string;
  applicant_user_id: string;
  status: string;
  score: number | null;
  cover_note: string | null;
  resume_url: string | null;
  reel_url: string | null;
  day_rate_proposed_cents: number | null;
  reviewer_notes: string | null;
  applied_at: string;
};

export default async function Page({ params }: { params: Promise<{ postingId: string; applicationId: string }> }) {
  const { postingId, applicationId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", applicationId)
    .eq("job_posting_id", postingId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const a = data as App;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.postings.applicants.detail.eyebrow", undefined, "Applicant")}
        title={`#${a.id.slice(0, 8)}`}
        subtitle={t(
          "console.marketplace.postings.applicants.detail.appliedSubtitle",
          { date: new Date(a.applied_at).toLocaleDateString() },
          `Applied ${new Date(a.applied_at).toLocaleDateString()}`,
        )}
        action={<Badge variant={STATUS_TONE[a.status] ?? "muted"}>{toTitle(a.status)}</Badge>}
      />
      <div className="page-content max-w-2xl space-y-5">
        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.postings.applicants.detail.coverNoteHeading", undefined, "Cover Note")}
          </h2>
          <div className="text-sm whitespace-pre-wrap">{a.cover_note ?? "—"}</div>
        </section>
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.postings.applicants.detail.profileHeading", undefined, "Profile")}
            </h2>
            <dl className="space-y-1 text-sm">
              <div>
                <span className="text-[var(--text-secondary)]">
                  {t("console.marketplace.postings.applicants.detail.resumeLabel", undefined, "Resume:")}
                </span>{" "}
                {a.resume_url ? (
                  <a className="font-mono text-[var(--org-primary)]" href={a.resume_url} target="_blank" rel="noopener">
                    ↗
                  </a>
                ) : (
                  "—"
                )}
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">
                  {t("console.marketplace.postings.applicants.detail.reelLabel", undefined, "Reel:")}
                </span>{" "}
                {a.reel_url ? (
                  <a className="font-mono text-[var(--org-primary)]" href={a.reel_url} target="_blank" rel="noopener">
                    ↗
                  </a>
                ) : (
                  "—"
                )}
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">
                  {t("console.marketplace.postings.applicants.detail.proposedRateLabel", undefined, "Proposed rate:")}
                </span>{" "}
                {a.day_rate_proposed_cents ? `$${(a.day_rate_proposed_cents / 100).toFixed(0)}` : "—"}
              </div>
            </dl>
          </div>
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.postings.applicants.detail.reviewerNotesHeading", undefined, "Reviewer Notes")}
            </h2>
            <div className="text-sm whitespace-pre-wrap">{a.reviewer_notes ?? "—"}</div>
            {a.score != null && (
              <p className="mt-2 font-mono text-xs">
                {t("console.marketplace.postings.applicants.detail.scoreLine", { score: a.score }, `Score: ${a.score}`)}
              </p>
            )}
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.postings.applicants.detail.moveApplicantHeading", undefined, "Move applicant")}
          </h2>
          <FormShell
            action={transitionApplicationAction}
            submitLabel={t(
              "console.marketplace.postings.applicants.detail.updateStageSubmit",
              undefined,
              "Update Stage",
            )}
          >
            <input type="hidden" name="application_id" value={a.id} />
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                {t("console.marketplace.postings.applicants.detail.stageLabel", undefined, "Stage")}
              </label>
              <select name="status" className="input-base mt-1.5 w-full" defaultValue={a.status}>
                {JOB_APPLICATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t("console.marketplace.postings.applicants.detail.scoreInputLabel", undefined, "Score (0-100)")}
              name="score"
              type="number"
              min={0}
              max={100}
              defaultValue={a.score ?? ""}
            />
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                {t("console.marketplace.postings.applicants.detail.reviewerNotesLabel", undefined, "Reviewer Notes")}
              </label>
              <textarea
                name="reviewer_notes"
                rows={4}
                maxLength={4000}
                className="input-base mt-1.5 w-full"
                defaultValue={a.reviewer_notes ?? ""}
              />
            </div>
          </FormShell>
        </section>
      </div>
    </>
  );
}
