import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { fmtDate } from "@/components/detail/DetailShell";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  subject: string | null;
  batch_state: string;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  project: string;
  recipients: number;
  submitted: number;
};

const STATE_VARIANT: Record<string, "success" | "info" | "warning" | "error" | "muted"> = {
  draft: "muted",
  scheduled: "info",
  sending: "warning",
  sent: "success",
  failed: "error",
};

export default async function AdvancesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.comms.advances.eyebrow", undefined, "Comms")}
          title={t("console.comms.advances.title", undefined, "Advance Sends")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.comms.advances.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("advance_send_batches")
    .select("id, subject, batch_state, scheduled_at, sent_at, created_at, advance_packets(projects(name))")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const batchIds = (data ?? []).map((b) => b.id);
  const counts = new Map<string, { total: number; submitted: number }>();
  if (batchIds.length > 0) {
    const { data: recipients } = await supabase
      .from("advance_send_recipients")
      .select("batch_id, delivery_state")
      .in("batch_id", batchIds)
      .is("deleted_at", null)
      .limit(5000);
    for (const r of (recipients ?? []) as Array<{ batch_id: string; delivery_state: string }>) {
      const entry = counts.get(r.batch_id) ?? { total: 0, submitted: 0 };
      entry.total += 1;
      if (r.delivery_state === "submitted" || r.delivery_state === "complete") entry.submitted += 1;
      counts.set(r.batch_id, entry);
    }
  }

  const rows: Row[] = (data ?? []).map((b) => {
    const packet = b.advance_packets as unknown as { projects: { name: string } | null } | null;
    return {
      id: b.id,
      subject: b.subject,
      batch_state: b.batch_state,
      scheduled_at: b.scheduled_at,
      sent_at: b.sent_at,
      created_at: b.created_at,
      project: packet?.projects?.name ?? "—",
      recipients: counts.get(b.id)?.total ?? 0,
      submitted: counts.get(b.id)?.submitted ?? 0,
    };
  });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.advances.eyebrow", undefined, "Comms")}
        title={t("console.comms.advances.title", undefined, "Advance Sends")}
        subtitle={
          rows.length === 1
            ? t("console.comms.advances.subtitleOne", { count: rows.length }, `${rows.length} send batch`)
            : t("console.comms.advances.subtitleOther", { count: rows.length }, `${rows.length} send batches`)
        }
        action={
          <Button href="/studio/comms/advances/new" size="sm">
            {t("console.comms.advances.newLabel", undefined, "+ New Send")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/comms/advances/${r.id}`}
          emptyLabel={t("console.comms.advances.emptyLabel", undefined, "No Advance Sends Yet")}
          emptyDescription={t(
            "console.comms.advances.emptyDescription",
            undefined,
            "One merge run per campaign: pick a live packet, map the audiences, preview per recipient, send, track. The packet is authored on the project's Advancing tab.",
          )}
          emptyAction={
            <Button href="/studio/comms/advances/new" size="sm">
              {t("console.comms.advances.createFirst", undefined, "Prepare Your First Send")}
            </Button>
          }
          columns={[
            {
              key: "project",
              header: t("console.comms.advances.columns.project", undefined, "Project"),
              render: (r) => r.project,
            },
            {
              key: "subject",
              header: t("console.comms.advances.columns.subject", undefined, "Subject"),
              render: (r) => r.subject ?? t("console.comms.advances.subjectAuto", undefined, "Merge grammar (auto)"),
            },
            {
              key: "batch_state",
              header: t("console.comms.advances.columns.state", undefined, "Status"),
              render: (r) => <Badge variant={STATE_VARIANT[r.batch_state] ?? "muted"}>{r.batch_state}</Badge>,
            },
            {
              key: "recipients",
              header: t("console.comms.advances.columns.recipients", undefined, "Recipients"),
              render: (r) => `${r.submitted}/${r.recipients}`,
            },
            {
              key: "sent_at",
              header: t("console.comms.advances.columns.sent", undefined, "Sent"),
              render: (r) => (r.sent_at ? fmtDate(r.sent_at) : "—"),
            },
          ]}
        />
      </div>
    </>
  );
}
