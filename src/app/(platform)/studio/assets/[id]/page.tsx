import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { RecordActionButton } from "@/components/RecordActionButton";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { addDepreciation, addMaintenance, checkInAssetAction, checkOutAssetAction } from "./actions";

export const dynamic = "force-dynamic";

type Asset = {
  id: string;
  display_name: string;
  asset_kind: string;
  state: string;
  ownership: string;
  serial: string | null;
  asset_tag: string | null;
  acquired_at: string | null;
  retired_at: string | null;
  acquisition_cost_minor: number | null;
  acquisition_currency: string | null;
  daily_rate_minor: number | null;
  daily_rate_currency: string | null;
};

type DepreciationRow = {
  id: string;
  method: string;
  useful_life_months: number;
  salvage_value_minor: number;
  start_at: string;
  posted_through: string | null;
};

type MaintenanceRow = {
  id: string;
  performed_at: string;
  outcome: string;
  cost_minor: number | null;
  cost_currency: string | null;
  notes: string | null;
};

function money(minor: number | null, currency: string | null): string {
  if (minor == null) return "—";
  return (minor / 100).toLocaleString("en-US", { style: "currency", currency: currency ?? "USD" });
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.assets.detail.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { id } = await params;
  const session = await requireSession();

  const asset = (await getOrgScoped("assets", session.orgId, id)) as Asset | null;
  if (!asset) notFound();

  // Child tables carry no org_id — scope by the (org-verified) asset id.
  const supabase = await createClient();
  const [{ data: depRows }, { data: maintRows }] = await Promise.all([
    supabase
      .from("asset_depreciation_schedule")
      .select("id, method, useful_life_months, salvage_value_minor, start_at, posted_through")
      .eq("asset_id", asset.id)
      .order("start_at", { ascending: false }),
    supabase
      .from("asset_maintenance_history")
      .select("id, performed_at, outcome, cost_minor, cost_currency, notes")
      .eq("asset_id", asset.id)
      .order("performed_at", { ascending: false }),
  ]);
  const depreciation = (depRows ?? []) as DepreciationRow[];
  const maintenance = (maintRows ?? []) as MaintenanceRow[];

  // v7.8 record actions — the state gates mirror the server-side checks
  // in checkOutAssetAction / checkInAssetAction, so exactly one button
  // shows (or neither, for terminal-ish states like retired or lost).
  const canCheckOut = ["available", "reserved", "acquired"].includes(asset.state);
  const canCheckIn = ["in_use", "in_transit"].includes(asset.state);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.detail.eyebrow", undefined, "Asset")}
        title={asset.display_name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{toTitle(asset.asset_kind)}</Badge>
            <StatusBadge status={asset.state} />
            <Badge variant="muted">{toTitle(asset.ownership.replace(/_/g, " "))}</Badge>
            {(asset.serial || asset.asset_tag) && (
              <span className="font-mono text-xs">{asset.serial || asset.asset_tag}</span>
            )}
          </span>
        }
        action={
          isManagerPlus(session) && (canCheckOut || canCheckIn) ? (
            <div className="flex items-center gap-2">
              {canCheckOut && (
                <RecordActionButton
                  action={checkOutAssetAction.bind(null, asset.id)}
                  label={t("console.assets.detail.checkOut", undefined, "Check Out")}
                  pendingLabel={t("console.assets.detail.checkingOut", undefined, "Checking Out…")}
                />
              )}
              {canCheckIn && (
                <RecordActionButton
                  action={checkInAssetAction.bind(null, asset.id)}
                  label={t("console.assets.detail.checkIn", undefined, "Check In")}
                  pendingLabel={t("console.assets.detail.checkingIn", undefined, "Checking In…")}
                />
              )}
            </div>
          ) : undefined
        }
      />
      <div className="page-content max-w-3xl space-y-6">
        {/* Overview */}
        <section className="surface grid grid-cols-2 gap-3 p-4 text-xs sm:grid-cols-4">
          <div>
            <div className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.assets.detail.acquisition", undefined, "Acquisition")}
            </div>
            <div className="mt-1 font-mono">{money(asset.acquisition_cost_minor, asset.acquisition_currency)}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.assets.detail.dailyRate", undefined, "Daily rate")}
            </div>
            <div className="mt-1 font-mono">{money(asset.daily_rate_minor, asset.daily_rate_currency)}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.assets.detail.acquired", undefined, "Acquired")}
            </div>
            <div className="mt-1 font-mono">{fmtDate(asset.acquired_at)}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.assets.detail.retired", undefined, "Retired")}
            </div>
            <div className="mt-1 font-mono">{fmtDate(asset.retired_at)}</div>
          </div>
        </section>

        {/* Depreciation */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.assets.detail.depreciationTitle", undefined, "Depreciation")}
          </h2>
          {depreciation.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.assets.detail.depreciationEmpty", undefined, "No depreciation schedule")}
            />
          ) : (
            <div className="surface overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-start">{t("console.assets.detail.dep.method", undefined, "Method")}</th>
                    <th className="text-end">{t("console.assets.detail.dep.life", undefined, "Life (mo)")}</th>
                    <th className="text-end">{t("console.assets.detail.dep.salvage", undefined, "Salvage")}</th>
                    <th className="text-start">{t("console.assets.detail.dep.start", undefined, "Start")}</th>
                    <th className="text-start">{t("console.assets.detail.dep.postedThrough", undefined, "Posted")}</th>
                  </tr>
                </thead>
                <tbody>
                  {depreciation.map((d) => (
                    <tr key={d.id}>
                      <td>{toTitle(d.method.replace(/_/g, " "))}</td>
                      <td className="text-end font-mono">{d.useful_life_months}</td>
                      <td className="text-end font-mono">{money(d.salvage_value_minor, "USD")}</td>
                      <td className="font-mono text-xs">{fmtDate(d.start_at)}</td>
                      <td className="font-mono text-xs">{fmtDate(d.posted_through)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <FormShell
            action={addDepreciation}
            submitLabel={t("console.assets.detail.addDepreciation", undefined, "Add schedule")}
          >
            <input type="hidden" name="asset_id" value={asset.id} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--p-text-2)]">
                  {t("console.assets.detail.dep.method", undefined, "Method")}
                </label>
                <select name="method" required className="ps-input mt-1.5 w-full" defaultValue="straight_line">
                  <option value="straight_line">
                    {t("console.assets.detail.dep.straightLine", undefined, "Straight line")}
                  </option>
                  <option value="declining_balance">
                    {t("console.assets.detail.dep.decliningBalance", undefined, "Declining balance")}
                  </option>
                </select>
              </div>
              <Input
                label={t("console.assets.detail.dep.life", undefined, "Useful life (months)")}
                name="useful_life_months"
                type="number"
                step="1"
                min="1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("console.assets.detail.dep.salvage", undefined, "Salvage value — USD")}
                name="salvage_value_usd"
                type="number"
                step="0.01"
                min="0"
              />
              <Input
                label={t("console.assets.detail.dep.start", undefined, "Start date")}
                name="start_at"
                type="date"
                required
              />
            </div>
          </FormShell>
        </section>

        {/* Maintenance */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.assets.detail.maintenanceTitle", undefined, "Maintenance history")}
          </h2>
          {maintenance.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.assets.detail.maintenanceEmpty", undefined, "No maintenance logged")}
            />
          ) : (
            <div className="surface overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-start">{t("console.assets.detail.maint.date", undefined, "Performed")}</th>
                    <th className="text-start">{t("console.assets.detail.maint.outcome", undefined, "Outcome")}</th>
                    <th className="text-end">{t("console.assets.detail.maint.cost", undefined, "Cost")}</th>
                    <th className="text-start">{t("console.assets.detail.maint.notes", undefined, "Notes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance.map((m) => (
                    <tr key={m.id}>
                      <td className="font-mono text-xs">{fmtDate(m.performed_at)}</td>
                      <td>{m.outcome}</td>
                      <td className="text-end font-mono">{money(m.cost_minor, m.cost_currency)}</td>
                      <td className="text-xs text-[var(--p-text-2)]">{m.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <FormShell
            action={addMaintenance}
            submitLabel={t("console.assets.detail.addMaintenance", undefined, "Log maintenance")}
          >
            <input type="hidden" name="asset_id" value={asset.id} />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("console.assets.detail.maint.date", undefined, "Performed date")}
                name="performed_at"
                type="date"
                required
              />
              <Input
                label={t("console.assets.detail.maint.cost", undefined, "Cost — USD")}
                name="cost_usd"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            <Input
              label={t("console.assets.detail.maint.outcome", undefined, "Outcome")}
              name="outcome"
              required
              maxLength={200}
              placeholder="Replaced capsule; passed bench test"
            />
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.assets.detail.maint.notes", undefined, "Notes")}
              </label>
              <textarea name="notes" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
            </div>
          </FormShell>
        </section>
      </div>
    </>
  );
}
