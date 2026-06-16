import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { disconnectAccountingConnection, syncAccountingConnection } from "./actions";
import { isSyncable } from "./sync-endpoints";

export const dynamic = "force-dynamic";

const SYSTEM_LABEL: Record<string, string> = {
  qb_online: "QuickBooks Online",
  qb_desktop: "QuickBooks Desktop",
  sage_300_cre: "Sage 300 CRE",
  sage_100_contractor: "Sage 100 Contractor",
  foundation: "Foundation Software",
  viewpoint_vista: "Viewpoint Vista",
  viewpoint_spectrum: "Viewpoint Spectrum",
  acumatica: "Acumatica",
  xero: "Xero",
};

type Row = {
  id: string;
  system: string;
  display_name: string;
  tenant_id: string | null;
  connection_state: string;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  deleted_at: string | null;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  // NOTE: auth_ciphertext / auth_key_ref are intentionally NOT selected —
  // secrets never reach the UI.
  const { data } = await supabase
    .from("accounting_connections")
    .select("id, system, display_name, tenant_id, connection_state, last_sync_at, last_error, created_at, deleted_at")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();

  const conn = data as Row | null;
  if (!conn) return notFound();

  const admin = isAdmin(session);
  const systemLabel = SYSTEM_LABEL[conn.system] ?? conn.system;
  const canSync = admin && conn.connection_state === "connected" && isSyncable(conn.system);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.integrations.accounting.detail.eyebrow", { system: systemLabel }, `Accounting · ${systemLabel}`)}
        title={conn.display_name}
        subtitle={
          conn.last_sync_at
            ? t(
                "console.settings.integrations.accounting.detail.lastSync",
                { time: fmt.dateParts(conn.last_sync_at, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) },
                `Last sync ${fmt.dateParts(conn.last_sync_at, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`,
              )
            : t("console.settings.integrations.accounting.detail.neverSynced", undefined, "Never synced")
        }
        action={<StatusBadge status={conn.connection_state} />}
      />
      <div className="page-content max-w-3xl space-y-5">
        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {t("console.settings.integrations.accounting.detail.connection", undefined, "Connection")}
          </h2>
          <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <dt className="text-[var(--p-text-2)]">
              {t("console.settings.integrations.accounting.detail.system", undefined, "System")}
            </dt>
            <dd>{systemLabel}</dd>
            <dt className="text-[var(--p-text-2)]">
              {t("console.settings.integrations.accounting.detail.displayName", undefined, "Display Name")}
            </dt>
            <dd>{conn.display_name}</dd>
            <dt className="text-[var(--p-text-2)]">
              {t("console.settings.integrations.accounting.detail.tenant", undefined, "Tenant")}
            </dt>
            <dd className="font-mono text-xs">{conn.tenant_id ?? "—"}</dd>
            <dt className="text-[var(--p-text-2)]">
              {t("console.settings.integrations.accounting.detail.state", undefined, "State")}
            </dt>
            <dd>
              <StatusBadge status={conn.connection_state} />
            </dd>
            <dt className="text-[var(--p-text-2)]">
              {t("console.settings.integrations.accounting.detail.lastSyncLabel", undefined, "Last Sync")}
            </dt>
            <dd className="font-mono text-xs">
              {conn.last_sync_at
                ? fmt.dateParts(conn.last_sync_at, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "—"}
            </dd>
            <dt className="text-[var(--p-text-2)]">
              {t("console.settings.integrations.accounting.detail.created", undefined, "Created")}
            </dt>
            <dd className="font-mono text-xs">
              {fmt.dateParts(conn.created_at, { month: "short", day: "numeric", year: "numeric" })}
            </dd>
          </dl>
        </section>

        {conn.last_error && (
          <section className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide text-[var(--p-danger)] uppercase">
              {t("console.settings.integrations.accounting.detail.lastError", undefined, "Last Error")}
            </h2>
            <pre className="overflow-x-auto font-mono text-xs whitespace-pre-wrap text-[var(--p-text-2)]">
              {conn.last_error}
            </pre>
          </section>
        )}

        {admin && (
          <section className="surface flex flex-wrap items-center gap-3 p-5">
            {canSync ? (
              <form action={syncAccountingConnection}>
                <input type="hidden" name="id" value={conn.id} />
                <Button type="submit" size="sm">
                  {t("console.settings.integrations.accounting.detail.syncNow", undefined, "Sync Now")}
                </Button>
              </form>
            ) : null}
            <form action={disconnectAccountingConnection}>
              <input type="hidden" name="id" value={conn.id} />
              <button type="submit" className="text-xs font-medium text-[var(--p-danger)] hover:underline">
                {t("console.settings.integrations.accounting.detail.disconnect", undefined, "Disconnect")}
              </button>
            </form>
          </section>
        )}
      </div>
    </>
  );
}
