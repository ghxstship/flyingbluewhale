import { formatDate } from "@/lib/i18n/format";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { stampRevision, addNextRound, closeSubmittal } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";

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

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        breadcrumbs={[{ label: "Submittals", href: "/console/submittals" }, { label: sub.code }]}
        title={`${sub.code} — ${sub.title}`}
        subtitle={`${project} · ${sub.spec_section ?? "no spec section"} · round #${sub.current_round}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[sub.status] ?? "muted"}>{sub.status.replace(/_/g, " ")}</Badge>
            <a
              href={`/console/submittals/${sub.id}/edit`}
              className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
            >
              Edit
            </a>
            {sub.status !== "closed" && sub.status !== "void" && (
              <form action={closeSubmittal.bind(null, id)}>
                <button className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium" type="submit">
                  Close
                </button>
              </form>
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Revision Rounds</h3>
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Round</th>
                <th>Submitted</th>
                <th>Stamp</th>
                <th>Stamp notes</th>
              </tr>
            </thead>
            <tbody>
              {all.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">#{r.round}</td>
                  <td className="font-mono text-xs">{formatDate(r.submitted_at)}</td>
                  <td>
                    <Badge variant={STATUS_TONE[r.stamp] ?? "muted"}>{r.stamp.replace(/_/g, " ")}</Badge>
                  </td>
                  <td>{r.stamp_notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {current && current.stamp === "no_stamp" && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">Stamp Round #{current.round}</h3>
            <form action={stampRevision.bind(null, id, current.id)} className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Stamp</span>
                  <select name="stamp" required className={INPUT}>
                    <option value="approved">Approved</option>
                    <option value="approved_with_comments">Approved with comments</option>
                    <option value="revise_resubmit">Revise &amp; resubmit</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
              </div>
              <textarea name="stamp_notes" rows={3} placeholder="Reviewer notes…" className={INPUT} />
              <div className="flex justify-end">
                <button type="submit" className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium">
                  Apply stamp
                </button>
              </div>
            </form>
          </section>
        )}

        {current && current.stamp === "revise_resubmit" && (
          <section className="surface p-4">
            <form action={addNextRound.bind(null, id)}>
              <button type="submit" className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium">
                + Open round #{sub.current_round + 1}
              </button>
            </form>
          </section>
        )}

        <ConversationPanel orgId={session.orgId} recordType="submittal" recordId={id} />
      </div>
    </>
  );
}
