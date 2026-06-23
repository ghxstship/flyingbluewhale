export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusChip } from "@/components/ui/StatusChip";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";
import { WebhookEditor } from "./WebhookEditor";

export default async function Page({ params }: { params: Promise<{ webhookId: string }> }) {
  const { webhookId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const [{ data: endpoint }, { data: deliveries }] = await Promise.all([
    supabase
      .from("webhook_endpoints")
      .select("id, url, description, events, is_active, last_delivery_at, last_error, failure_count, created_at")
      .eq("org_id", session.orgId)
      .eq("id", webhookId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("webhook_deliveries")
      .select("id, event_type, state, attempts, last_status, last_error, created_at, delivered_at")
      .eq("endpoint_id", webhookId)
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);
  if (!endpoint) notFound();
  const rows = (deliveries ?? []) as Array<{
    id: string;
    event_type: string;
    state: string;
    attempts: number;
    last_status: number | null;
    last_error: string | null;
    created_at: string;
    delivered_at: string | null;
  }>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.webhooks.detail.eyebrow", undefined, "Settings · Webhooks")}
        title={endpoint.url}
        subtitle={endpoint.description ?? undefined}
        breadcrumbs={[
          { label: t("console.settings.title", undefined, "Settings") },
          { label: t("console.settings.webhooks.title", undefined, "Webhooks"), href: "/studio/settings/webhooks" },
          { label: endpoint.url },
        ]}
      />
      <div className="page-content max-w-4xl space-y-6">
        <WebhookEditor
          id={endpoint.id}
          initialUrl={endpoint.url}
          initialDescription={endpoint.description ?? ""}
          initialEvents={endpoint.events ?? []}
          initialActive={endpoint.is_active}
        />

        <section className="surface">
          <div className="border-b border-[var(--p-border)] px-5 py-3">
            <h3 className="text-sm font-semibold">
              {t("console.settings.webhooks.detail.recentDeliveries", undefined, "Recent Deliveries")}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--p-text-2)]">
              {t("console.settings.webhooks.detail.last25", undefined, "Last 25 attempts")}
            </p>
          </div>
          {rows.length === 0 ? (
            <div className="p-5 text-sm text-[var(--p-text-2)]">
              {t("console.settings.webhooks.detail.empty", undefined, "No deliveries recorded yet.")}
            </div>
          ) : (
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.settings.webhooks.detail.col.when", undefined, "When")}</th>
                  <th>{t("console.settings.webhooks.detail.col.event", undefined, "Event")}</th>
                  <th>{t("console.settings.webhooks.detail.col.state", undefined, "State")}</th>
                  <th>{t("console.settings.webhooks.detail.col.http", undefined, "HTTP")}</th>
                  <th>{t("console.settings.webhooks.detail.col.attempts", undefined, "Attempts")}</th>
                  <th>{t("console.settings.webhooks.detail.col.error", undefined, "Error")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td className="font-mono text-xs">{fmtDateTime(d.created_at)}</td>
                    <td className="font-mono text-xs">{d.event_type}</td>
                    <td>
                      <StatusChip
                        tone={
                          d.state === "delivered"
                            ? "success"
                            : d.state === "pending"
                              ? "info"
                              : d.state === "failed"
                                ? "warning"
                                : "danger"
                        }
                      >
                        {d.state}
                      </StatusChip>
                    </td>
                    <td className="font-mono text-xs">{d.last_status ?? "—"}</td>
                    <td className="font-mono text-xs">{d.attempts}</td>
                    <td className="max-w-xs truncate text-xs text-[var(--p-danger)]" title={d.last_error ?? undefined}>
                      {d.last_error ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
