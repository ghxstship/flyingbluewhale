import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { DeleteForm } from "@/components/DeleteForm";
import { RecordActionButton } from "@/components/RecordActionButton";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { ASSET_CLASS_LABELS, ASSET_DISPOSITION_LABELS, CHECK_IN, CHECK_OUT, NEXT_UAL_STATES } from "@/lib/db/assets";
import type { Asset, UalState } from "@/lib/supabase/types";
import { addDepreciation, addMaintenance } from "./actions";
import { checkInAsset, checkOutAsset, deleteAsset, setAssetState } from "../actions";

export const dynamic = "force-dynamic";

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

type MovementRow = {
  id: string;
  movement_kind: string;
  from_state: string | null;
  to_state: string;
  occurred_at: string;
  notes: string | null;
  recorded_by: string | null;
};

type RentalRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  rate_cents: number | null;
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
  const [{ data: depRows }, { data: maintRows }, { data: movementRows }, { data: rentalRows }, { data: location }] =
    await Promise.all([
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
      supabase
        .from("asset_movements")
        // recorded_by FKs auth.users, so it can't be embedded — names are
        // hydrated from public.users in a second lookup below.
        .select("id, movement_kind, from_state, to_state, occurred_at, notes, recorded_by")
        .eq("asset_id", asset.id)
        .order("occurred_at", { ascending: false })
        .limit(50),
      supabase
        .from("rentals")
        .select("id, starts_at, ends_at, rate_cents")
        .eq("org_id", session.orgId)
        .eq("asset_id", asset.id)
        .order("starts_at", { ascending: false })
        .limit(20),
      asset.location_id
        ? supabase.from("locations").select("name").eq("id", asset.location_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  const depreciation = (depRows ?? []) as DepreciationRow[];
  const maintenance = (maintRows ?? []) as MaintenanceRow[];
  const movements = (movementRows ?? []) as unknown as MovementRow[];
  const rentals = (rentalRows ?? []) as RentalRow[];

  // Hydrate recorder names from public.users (recorded_by FKs auth.users).
  const recorderIds = Array.from(new Set(movements.map((m) => m.recorded_by).filter((v): v is string => !!v)));
  const { data: recorderRows } = recorderIds.length
    ? await supabase.from("users").select("id, name, email").in("id", recorderIds)
    : { data: [] as Array<{ id: string; name: string | null; email: string | null }> };
  const recorderById = new Map((recorderRows ?? []).map((u) => [u.id, u] as const));

  const state = asset.state as UalState;
  const canCheckOut = CHECK_OUT.from.includes(state);
  const canCheckIn = CHECK_IN.from.includes(state);
  const transitions = (NEXT_UAL_STATES[state] ?? []).filter(
    (to) => !(canCheckOut && to === CHECK_OUT.to) && !(canCheckIn && to === CHECK_IN.to),
  );

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.assets.eyebrow", undefined, "Production · Build")}
        title={asset.display_name}
        breadcrumbs={[
          { label: t("console.assets.eyebrowShort", undefined, "Production") },
          { label: t("console.assets.title", undefined, "Assets & Inventory"), href: "/studio/assets" },
          { label: asset.display_name },
        ]}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="info">{ASSET_CLASS_LABELS[asset.asset_class]}</Badge>
            <Badge variant="muted">{toTitle(asset.asset_kind)}</Badge>
            <StatusBadge status={asset.state} />
            <Badge variant="muted">{toTitle(asset.ownership.replace(/_/g, " "))}</Badge>
            {asset.qty > 1 && <Badge variant="muted">{`Qty ${asset.qty}`}</Badge>}
            {asset.disposition && <Badge variant="warning">{ASSET_DISPOSITION_LABELS[asset.disposition]}</Badge>}
            {(asset.serial || asset.asset_tag) && (
              <span className="font-mono text-xs">{asset.serial || asset.asset_tag}</span>
            )}
          </span>
        }
        action={
          isManagerPlus(session) ? (
          <div className="flex flex-wrap items-center gap-1">
            {canCheckOut && (
              <RecordActionButton
                action={checkOutAsset.bind(null, asset.id)}
                label={t("console.assets.detail.checkOut", undefined, "Check Out")}
                pendingLabel={t("console.assets.detail.checkOutPending", undefined, "Checking Out…")}
              />
            )}
            {canCheckIn && (
              <RecordActionButton
                action={checkInAsset.bind(null, asset.id)}
                label={t("console.assets.detail.checkIn", undefined, "Check In")}
                pendingLabel={t("console.assets.detail.checkInPending", undefined, "Checking In…")}
              />
            )}
            {transitions.map((to) => (
              <form key={to} action={setAssetState} className="inline">
                <input type="hidden" name="id" value={asset.id} />
                <input type="hidden" name="state" value={to} />
                <button
                  type="submit"
                  className={`rounded-md border border-[var(--p-border)] px-2.5 py-1 text-xs font-medium transition-colors ${
                    to === "retired" || to === "lost"
                      ? "text-[color:var(--p-danger)] hover:bg-[color:var(--p-danger)]/10"
                      : "text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)]"
                  }`}
                >
                  {t("console.assets.detail.markState", { state: toTitle(to) }, `Mark ${toTitle(to)}`)}
                </button>
              </form>
            ))}
            <a href={`/studio/assets/${asset.id}/qr`} className="ps-btn ps-btn--ghost ps-btn--sm">
              {t("console.assets.detail.qr", undefined, "QR")}
            </a>
            <a href={`/studio/assets/${asset.id}/edit`} className="ps-btn ps-btn--ghost ps-btn--sm">
              {t("common.edit", undefined, "Edit")}
            </a>
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
              {t("console.assets.detail.location", undefined, "Location")}
            </div>
            <div className="mt-1">{location?.name ?? "—"}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.assets.detail.acquired", undefined, "Acquired")}
            </div>
            <div className="mt-1 font-mono">{fmtDate(asset.acquired_at)}</div>
          </div>
        </section>
        {asset.notes && <section className="surface p-4 text-xs text-[var(--p-text-2)]">{asset.notes}</section>}

        {/* Movement ledger */}
        <section className="surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">
              {t("console.assets.detail.ledger.title", undefined, "Movement Ledger")}
            </h2>
            <span className="font-mono text-xs text-[var(--p-text-2)]">
              {movements.length === 1
                ? t("console.assets.detail.ledger.countOne", { count: movements.length }, "1 recent movement")
                : t(
                    "console.assets.detail.ledger.countOther",
                    { count: movements.length },
                    `${movements.length} recent movements`,
                  )}
            </span>
          </div>
          {movements.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "console.assets.detail.ledger.empty",
                undefined,
                "No movements recorded yet. Every state change writes a row to the append-only ledger.",
              )}
            </p>
          ) : (
            <ol className="mt-3 space-y-2 text-xs">
              {movements.map((m) => {
                const recorder = m.recorded_by ? recorderById.get(m.recorded_by) : null;
                const who =
                  recorder?.name ?? recorder?.email ?? t("console.assets.detail.ledger.system", undefined, "system");
                return (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-2 last:border-0"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge variant="muted">{toTitle(m.movement_kind)}</Badge>
                      {m.from_state && (
                        <>
                          <StatusBadge status={m.from_state} /> →{" "}
                        </>
                      )}
                      <StatusBadge status={m.to_state} />
                      <span className="text-[var(--p-text-2)]">
                        {t("console.assets.detail.ledger.by", { who }, `by ${who}`)}
                      </span>
                      {m.notes && <span className="text-[var(--p-text-2)]">— {m.notes}</span>}
                    </span>
                    <span className="font-mono text-[var(--p-text-2)]">{new Date(m.occurred_at).toLocaleString()}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Rentals against this asset */}
        {rentals.length > 0 && (
          <section className="surface p-5">
            <h2 className="text-sm font-semibold">
              {t("console.assets.detail.rentalsTitle", undefined, "Rental Windows")}
            </h2>
            <ol className="mt-3 space-y-2 text-xs">
              {rentals.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <a className="font-mono hover:underline" href={`/studio/production/rentals/${r.id}`}>
                    {fmtDate(r.starts_at)} → {fmtDate(r.ends_at)}
                  </a>
                  <span className="font-mono text-[var(--p-text-2)]">{money(r.rate_cents, "USD")}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

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
                label={t("console.assets.detail.dep.salvage", undefined, "Salvage value in USD")}
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
                label={t("console.assets.detail.maint.cost", undefined, "Cost in USD")}
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

        <section className="surface p-4 text-xs">
          <div className="flex items-center justify-between">
            <Badge variant="muted">{t("console.assets.detail.lifecycle", undefined, "Lifecycle")}</Badge>
            <DeleteForm
              action={deleteAsset.bind(null, asset.id)}
              confirm={t(
                "console.assets.detail.deleteConfirm",
                undefined,
                "Remove this asset? It is soft-deleted and can be restored right after.",
              )}
              label={t("console.assets.detail.remove", undefined, "Remove Asset")}
              undo={{ table: "assets", id: asset.id, redirectTo: "/studio/assets" }}
            />
          </div>
        </section>
      </div>
    </>
  );
}
