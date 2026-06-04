import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { recordSalesSnapshotAction } from "./actions";

export const dynamic = "force-dynamic";

type Connection = {
  id: string;
  provider: string;
  external_event_id: string | null;
  label: string | null;
  is_active: boolean;
  last_synced_at: string | null;
};

type Snapshot = {
  id: string;
  snapshot_at: string;
  total_sold: number;
  total_capacity: number | null;
  total_gross_cents: number;
  currency: string;
};

export default async function Page({ params }: { params: Promise<{ connectionId: string }> }) {
  const { connectionId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [connResp, snapshotsResp] = await Promise.all([
    supabase
      .from("ticketing_connections")
      .select("id, provider, external_event_id, label, is_active, last_synced_at")
      .eq("id", connectionId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("ticketing_sales_snapshots")
      .select("id, snapshot_at, total_sold, total_capacity, total_gross_cents, currency")
      .eq("ticketing_connection_id", connectionId)
      .eq("org_id", session.orgId)
      .order("snapshot_at", { ascending: false })
      .limit(50),
  ]);
  if (!connResp.data) return notFound();
  const c = connResp.data as Connection;
  const snapshots = (snapshotsResp.data ?? []) as Snapshot[];
  const latest = snapshots[0] ?? null;

  return (
    <>
      <ModuleHeader
        eyebrow={t(
          "console.settings.integrations.ticketing.connection.eyebrow",
          { provider: c.provider },
          `Ticketing · ${c.provider}`,
        )}
        title={
          c.label ??
          c.external_event_id ??
          t("console.settings.integrations.ticketing.connection.fallbackTitle", undefined, "Connection")
        }
        subtitle={
          c.last_synced_at
            ? t(
                "console.settings.integrations.ticketing.connection.lastSync",
                { time: new Date(c.last_synced_at).toLocaleString() },
                `Last sync ${new Date(c.last_synced_at).toLocaleString()}`,
              )
            : t("console.settings.integrations.ticketing.connection.neverSynced", undefined, "Never synced")
        }
        action={
          <Badge variant={c.is_active ? "success" : "muted"}>
            {c.is_active
              ? t("console.settings.integrations.ticketing.connection.active", undefined, "active")
              : t("console.settings.integrations.ticketing.connection.inactive", undefined, "inactive")}
          </Badge>
        }
      />
      <div className="page-content max-w-3xl space-y-5">
        {latest && (
          <section className="surface p-5">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
              {t("console.settings.integrations.ticketing.connection.latestSnapshot", undefined, "Latest Snapshot")}
            </h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--text-secondary)]">
                {t("console.settings.integrations.ticketing.connection.sold", undefined, "Sold")}
              </dt>
              <dd className="font-mono">
                {latest.total_sold}
                {latest.total_capacity ? ` / ${latest.total_capacity}` : ""}
              </dd>
              <dt className="text-[var(--text-secondary)]">
                {t("console.settings.integrations.ticketing.connection.gross", undefined, "Gross")}
              </dt>
              <dd className="font-mono">{formatMoney(latest.total_gross_cents)}</dd>
              <dt className="text-[var(--text-secondary)]">
                {t("console.settings.integrations.ticketing.connection.asOf", undefined, "As of")}
              </dt>
              <dd className="font-mono">{new Date(latest.snapshot_at).toLocaleString()}</dd>
            </dl>
          </section>
        )}

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {t("console.settings.integrations.ticketing.connection.recordSnapshot", undefined, "Record Snapshot")}
          </h2>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">
            {t(
              "console.settings.integrations.ticketing.connection.manualEntryHelp",
              undefined,
              "Manual entry. Once API webhooks land per provider, snapshots will auto-ingest.",
            )}
          </p>
          <FormShell
            action={recordSalesSnapshotAction}
            submitLabel={t(
              "console.settings.integrations.ticketing.connection.recordSnapshot",
              undefined,
              "Record Snapshot",
            )}
          >
            <input type="hidden" name="connection_id" value={c.id} />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("console.settings.integrations.ticketing.connection.ticketsSold", undefined, "Tickets Sold")}
                name="total_sold"
                type="number"
                min={0}
                required
              />
              <Input
                label={t(
                  "console.settings.integrations.ticketing.connection.totalCapacity",
                  undefined,
                  "Total Capacity",
                )}
                name="total_capacity"
                type="number"
                min={0}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("console.settings.integrations.ticketing.connection.grossRevenue", undefined, "Gross Revenue")}
                name="total_gross"
                required
                placeholder="12500"
              />
              <Input
                label={t("console.settings.integrations.ticketing.connection.currency", undefined, "Currency")}
                name="currency"
                maxLength={3}
                defaultValue="USD"
              />
            </div>
          </FormShell>
        </section>

        {snapshots.length > 1 && (
          <section className="surface p-5">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
              {t("console.settings.integrations.ticketing.connection.history", undefined, "History")}
            </h2>
            <ul className="divide-y divide-[var(--border-subtle)]">
              {snapshots.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    {new Date(s.snapshot_at).toLocaleString()}
                  </span>
                  <span className="font-mono text-xs">
                    {t(
                      "console.settings.integrations.ticketing.connection.soldGross",
                      { sold: s.total_sold, gross: formatMoney(s.total_gross_cents) },
                      `${s.total_sold} sold · ${formatMoney(s.total_gross_cents)}`,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
