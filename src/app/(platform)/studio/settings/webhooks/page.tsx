export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

const EVENTS = [
  "project.created",
  "project.status_changed",
  "invoice.sent",
  "invoice.paid",
  "proposal.sent",
  "proposal.signed",
  "deliverable.submitted",
  "deliverable.approved",
  "ticket.scanned",
  "po.acknowledged",
  "po.fulfilled",
  "incident.filed",
  "passkey.registered",
  "account.deletion_requested",
];

export default async function WebhooksPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const { data: endpoints } = await supabase
    .from("webhook_endpoints")
    .select("id, url, description, events, is_active, last_delivery_at, last_error, failure_count, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const rows = (endpoints ?? []) as Array<{
    id: string;
    url: string;
    description: string | null;
    events: string[];
    is_active: boolean;
    last_delivery_at: string | null;
    last_error: string | null;
    failure_count: number;
    created_at: string;
  }>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.webhooks.eyebrow", undefined, "Settings")}
        title={t("console.settings.webhooks.title", undefined, "Webhooks")}
        subtitle={t("console.settings.webhooks.subtitle", undefined, "Outgoing event notifications to your endpoints.")}
        action={
          <Button href="/studio/settings/webhooks/new" size="sm">
            {t("console.settings.webhooks.newEndpoint", undefined, "+ New Endpoint")}
          </Button>
        }
      />
      <div className="page-content space-y-4">
        <div className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("console.settings.webhooks.subscribableEvents", undefined, "Subscribable Events")}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {EVENTS.map((e) => (
              <Badge key={e} variant="muted">
                <span className="font-mono">{e}</span>
              </Badge>
            ))}
            <Badge variant="info">
              <span className="font-mono">*</span>
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[var(--p-text-2)]">
            {t("console.settings.webhooks.wildcardHintBefore", undefined, "Use ")}
            <span className="font-mono">*</span>
            {t("console.settings.webhooks.wildcardHintAfter", undefined, " to subscribe to every event.")}
          </p>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title={t("console.settings.webhooks.emptyTitle", undefined, "No Endpoints Registered")}
            description={t(
              "console.settings.webhooks.emptyDescription",
              undefined,
              "Register an endpoint to receive real-time events. Payloads are HMAC-signed with a secret shown once at creation.",
            )}
          />
        ) : (
          <div className="surface">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.settings.webhooks.col.url", undefined, "URL")}</th>
                  <th>{t("console.settings.webhooks.col.events", undefined, "Events")}</th>
                  <th>{t("console.settings.webhooks.col.state", undefined, "State")}</th>
                  <th>{t("console.settings.webhooks.col.lastDelivery", undefined, "Last delivery")}</th>
                  <th>{t("console.settings.webhooks.col.failures", undefined, "Failures")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">
                      <div className="max-w-xs truncate" title={r.url}>
                        {r.url}
                      </div>
                      {r.description && (
                        <div className="mt-0.5 text-[11px] text-[var(--p-text-2)]">{r.description}</div>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {r.events.slice(0, 3).map((e) => (
                          <span key={e} className="rounded bg-[var(--p-surface-2)] px-1.5 py-0.5 font-mono text-[11px]">
                            {e}
                          </span>
                        ))}
                        {r.events.length > 3 && (
                          <span className="font-mono text-[11px] text-[var(--p-text-2)]">+{r.events.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <StatusChip tone={r.is_active ? "success" : "neutral"}>
                        {r.is_active
                          ? t("console.settings.webhooks.state.active", undefined, "active")
                          : t("console.settings.webhooks.state.paused", undefined, "paused")}
                      </StatusChip>
                    </td>
                    <td className="font-mono text-xs">{fmtDate(r.last_delivery_at)}</td>
                    <td className="font-mono text-xs">{r.failure_count}</td>
                    <td>
                      <Link href={`/studio/settings/webhooks/${r.id}`} className="text-xs text-[var(--p-accent)]">
                        {t("console.settings.webhooks.editAction", undefined, "Edit →")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
