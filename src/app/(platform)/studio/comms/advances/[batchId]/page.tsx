export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtDate } from "@/components/detail/DetailShell";
import { urlFor } from "@/lib/urls";
import {
  getBatch,
  listBatchRecipients,
  type AdvanceDeliveryState,
} from "@/lib/db/advance-packets";
import { sendBatchAction, testSendAction, completeRecipientAction } from "./actions";

const FUNNEL_VARIANT: Record<AdvanceDeliveryState, "success" | "info" | "warning" | "error" | "muted"> = {
  queued: "muted",
  delivered: "info",
  bounced: "error",
  opened: "info",
  started: "warning",
  submitted: "success",
  complete: "success",
};

export default async function BatchBoardPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const batch = await getBatch(session.orgId, batchId);
  if (!batch) notFound();

  const [{ data: packet }, recipients, { data: lastTransition }] = await Promise.all([
    supabase
      .from("advance_packets")
      .select("id, voice, projects(name, slug)")
      .eq("id", batch.packet_id)
      .is("deleted_at", null)
      .maybeSingle(),
    listBatchRecipients(batch.id),
    // The send outcome ("N delivered, N failed, N skipped (no email provider
    // key)") lives only in the transition ledger — surface the latest reason
    // so a failed batch explains itself instead of showing bare queued rows.
    // soft-delete-exempt: append-only ledger, no deleted_at column.
    supabase
      .from("advance_send_batch_state_transitions")
      .select("reason, to_state, created_at")
      .eq("batch_id", batch.id)
      .not("reason", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const transitionNote = (lastTransition as { reason: string | null } | null)?.reason ?? null;
  const project = (packet as unknown as { projects: { name: string; slug: string } | null } | null)?.projects;

  const audienceIds = Array.from(new Set(recipients.map((r) => r.audience_id).filter(Boolean))) as string[];
  const audienceById = new Map<string, { company: string; team: string | null }>();
  if (audienceIds.length > 0) {
    const { data: audiences } = await supabase
      .from("advance_audiences")
      .select("id, company, team")
      .in("id", audienceIds)
      .is("deleted_at", null);
    for (const a of (audiences ?? []) as Array<{ id: string; company: string; team: string | null }>) {
      audienceById.set(a.id, a);
    }
  }

  const tally = (state: AdvanceDeliveryState) => recipients.filter((r) => r.delivery_state === state).length;
  const doneCount = tally("submitted") + tally("complete");
  const canSend = ["draft", "scheduled", "failed"].includes(batch.batch_state);

  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? t("console.comms.advances.eyebrow", undefined, "Comms")}
        title={batch.subject ?? t("console.comms.advances.board.title", undefined, "Advance Send")}
        subtitle={t(
          "console.comms.advances.board.subtitle",
          undefined,
          "Delivered · opened · started · submitted · confirmed, per recipient.",
        )}
        breadcrumbs={[
          { label: t("console.comms.advances.title", undefined, "Advance Sends"), href: "/studio/comms/advances" },
          { label: t("console.comms.advances.board.breadcrumb", undefined, "Tracking Board") },
        ]}
        action={
          <div className="flex items-center gap-2">
            <form action={testSendAction.bind(null, batch.id)}>
              <button type="submit" className="ps-btn ps-btn--sm">
                {t("console.comms.advances.board.testSend", undefined, "Test Send to Self")}
              </button>
            </form>
            {canSend && (
              <form action={sendBatchAction.bind(null, batch.id)}>
                <button type="submit" className="ps-btn ps-btn--sm ps-btn--cta">
                  {t("console.comms.advances.board.send", undefined, "Send Batch")}
                </button>
              </form>
            )}
          </div>
        }
      />
      <div className="page-content max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={batch.batch_state} />
          {batch.scheduled_at && (
            <span className="font-mono text-xs text-[var(--p-text-2)]">
              {t("console.comms.advances.board.scheduledFor", undefined, "Scheduled")} · {fmtDate(batch.scheduled_at)}
            </span>
          )}
          {batch.sent_at && (
            <span className="font-mono text-xs text-[var(--p-text-2)]">
              {t("console.comms.advances.board.sentAt", undefined, "Sent")} · {fmtDate(batch.sent_at)}
            </span>
          )}
          {transitionNote && (
            <span className="font-mono text-xs text-[var(--p-text-2)]">
              {t("console.comms.advances.board.lastOutcome", undefined, "Last run")} · {transitionNote}
            </span>
          )}
        </div>

        <div className="metric-grid">
          <MetricCard
            label={t("console.comms.advances.board.metrics.recipients", undefined, "Recipients")}
            value={String(recipients.length)}
          />
          <MetricCard
            label={t("console.comms.advances.board.metrics.delivered", undefined, "Delivered")}
            value={String(recipients.length - tally("queued") - tally("bounced"))}
          />
          <MetricCard
            label={t("console.comms.advances.board.metrics.submitted", undefined, "Submitted")}
            value={String(doneCount)}
          />
          <MetricCard
            label={t("console.comms.advances.board.metrics.bounced", undefined, "Bounced")}
            value={String(tally("bounced"))}
          />
        </div>

        {recipients.length === 0 ? (
          <EmptyState
            title={t("console.comms.advances.board.empty", undefined, "No Recipients")}
            description={t(
              "console.comms.advances.board.emptyDescription",
              undefined,
              "Add contacts to the packet's audiences, then prepare a new batch.",
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.comms.advances.board.columns.recipient", undefined, "Recipient")}</th>
                  <th>{t("console.comms.advances.board.columns.audience", undefined, "Audience")}</th>
                  <th>{t("console.comms.advances.board.columns.state", undefined, "Funnel")}</th>
                  <th>{t("console.comms.advances.board.columns.late", undefined, "Late")}</th>
                  <th>{t("console.comms.advances.board.columns.portal", undefined, "Portal")}</th>
                  <th className="text-end">{t("console.comms.advances.board.columns.actions", undefined, "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => {
                  const audience = r.audience_id ? audienceById.get(r.audience_id) : undefined;
                  const portalUrl = project
                    ? urlFor("portal", `/${project.slug}/advancing?t=${r.portal_token}`)
                    : null;
                  return (
                    <tr key={r.id}>
                      <td>
                        <div>{r.contact?.name ?? "—"}</div>
                        <div className="font-mono text-xs text-[var(--p-text-2)]">{r.contact?.email}</div>
                      </td>
                      <td>
                        {audience ? (audience.team ? `${audience.team} · ${audience.company}` : audience.company) : "—"}
                      </td>
                      <td>
                        <Badge variant={FUNNEL_VARIANT[r.delivery_state] ?? "muted"}>{r.delivery_state}</Badge>
                      </td>
                      <td>
                        {r.late_flagged_at ? (
                          <Badge variant="error">
                            {t("console.comms.advances.board.lateFlag", undefined, "Late")}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="font-mono text-xs">
                        {portalUrl ? (
                          <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="underline">
                            {t("console.comms.advances.board.portalLink", undefined, "Open Link")}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-end">
                        {(r.delivery_state === "submitted" || r.delivery_state === "started") && (
                          <form action={completeRecipientAction.bind(null, batch.id)} className="inline">
                            <input type="hidden" name="recipient_id" value={r.id} />
                            <button type="submit" className="ps-btn ps-btn--sm">
                              {t("console.comms.advances.board.markComplete", undefined, "Mark Complete")}
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
