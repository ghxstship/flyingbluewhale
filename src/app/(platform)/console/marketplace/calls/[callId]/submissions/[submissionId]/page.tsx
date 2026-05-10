import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { SUBMISSION_STATUSES, STATUS_TONE } from "@/lib/marketplace";
import { formatMoney } from "@/lib/i18n/format";
import { transitionSubmissionAction } from "./actions";

export const dynamic = "force-dynamic";

type Sub = {
  id: string;
  submitter_user_id: string;
  talent_profile_id: string | null;
  status: string;
  score: number | null;
  internal_notes: string | null;
  cover_note: string | null;
  fee_proposed_cents: number | null;
  submitted_at: string;
};

export default async function Page({ params }: { params: Promise<{ callId: string; submissionId: string }> }) {
  const { callId, submissionId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("open_call_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("open_call_id", callId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const s = data as Sub;

  return (
    <>
      <ModuleHeader
        eyebrow="Submission"
        title={`#${s.id.slice(0, 8)}`}
        subtitle={`Submitted ${new Date(s.submitted_at).toLocaleString()}`}
        action={<Badge variant={STATUS_TONE[s.status] ?? "muted"}>{s.status}</Badge>}
      />
      <div className="page-content max-w-2xl space-y-5">
        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Cover Note</h2>
          <div className="text-sm whitespace-pre-wrap">{s.cover_note ?? "—"}</div>
        </section>

        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Submitter</h2>
          <dl className="space-y-1 text-sm">
            <div>
              <span className="text-[var(--text-secondary)]">User:</span>{" "}
              <span className="font-mono">{s.submitter_user_id.slice(0, 8)}</span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Talent profile:</span>{" "}
              {s.talent_profile_id ? (
                <a
                  className="font-mono text-[var(--org-primary)]"
                  href={`/console/marketplace/talent/${s.talent_profile_id}`}
                >
                  ↗
                </a>
              ) : (
                "—"
              )}
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Proposed fee:</span>{" "}
              {s.fee_proposed_cents ? formatMoney(s.fee_proposed_cents) : "—"}
            </div>
            {s.score != null && (
              <div>
                <span className="text-[var(--text-secondary)]">Score:</span>{" "}
                <span className="font-mono">{s.score}</span>
              </div>
            )}
          </dl>
        </section>

        {s.internal_notes && (
          <section className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Internal Notes</h2>
            <div className="text-sm whitespace-pre-wrap">{s.internal_notes}</div>
          </section>
        )}

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Move submission</h2>
          <FormShell action={transitionSubmissionAction} submitLabel="Update Status">
            <input type="hidden" name="submission_id" value={s.id} />
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Status</label>
              <select name="status" className="input-base mt-1.5 w-full" defaultValue={s.status}>
                {SUBMISSION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Score (0-100)" name="score" type="number" min={0} max={100} defaultValue={s.score ?? ""} />
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)]">Internal Notes</label>
              <textarea
                name="internal_notes"
                rows={4}
                maxLength={4000}
                className="input-base mt-1.5 w-full"
                defaultValue={s.internal_notes ?? ""}
              />
            </div>
          </FormShell>
        </section>
      </div>
    </>
  );
}
