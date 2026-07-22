import Link from "next/link";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { listFieldPurchaseRequests } from "@/lib/db/purchase-requests";
import { EmptyState } from "@/components/ui/EmptyState";
import { HubChrome } from "@/components/mobile/HubChrome";
import { KIcon } from "@/components/mobile/kit";
import { FinanceSyncButton } from "./FinanceSyncButton";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Finance (kit 31, live-test resolution #23) — the field window
 * into the ATLVS budget for the manager band (kit perm `approve`): totals
 * row, per-cost-code committed vs actual bars, recent purchase orders, and
 * uncoded spend awaiting a cost code. Source of truth is the ATLVS budget;
 * nothing here is authored on-site except the coding of scanned spend.
 *
 * Every number is a real org read (budgets / purchase_orders / expenses).
 * Where a table has no rows the section says so — never fabricated.
 */

const PO_TONE: Record<string, string> = {
  approved: "ok",
  issued: "ok",
  ordered: "ok",
  received: "neutral",
  closed: "neutral",
  fulfilled: "neutral",
  cancelled: "danger",
  rejected: "danger",
  draft: "neutral",
  submitted: "warn",
  pending: "warn",
  pending_approval: "warn",
};

export default async function FinancePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.finance.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();

  if (!isManagerPlus(session)) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.finance.eyebrow", undefined, "Budget")}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {t("m.finance.title", undefined, "Finance")}
        </h1>
        <EmptyState
          size="compact"
          title={t("m.finance.gated.title", undefined, "Manager Access Only")}
          description={t(
            "m.finance.gated.body",
            undefined,
            "Budget visibility and coded spend are an approvals surface. Ask a manager if you need these numbers.",
          )}
        />
      </div>
    );
  }

  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Scope to the org's current active project when there is one (the kit's
  // finance surface is the on-site window into the running production).
  const { data: proj } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .eq("project_state", "active")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const project = proj as { id: string; name: string } | null;

  let budgetQuery = supabase
    .from("budgets")
    .select("code, department, xtc_code, name, amount_cents, committed_cents, spent_cents, actual_cents")
    .eq("org_id", session.orgId)
    .limit(500);
  if (project) budgetQuery = budgetQuery.eq("project_id", project.id);

  const [{ data: budgetRows }, pos, { data: uncodedRows }] = await Promise.all([
    budgetQuery,
    // The shared field PO-request read (kit 31 #20/#23) — the same rows the
    // /m/requisitions PO form writes, so the two surfaces can't disagree.
    listFieldPurchaseRequests(session.orgId, { limit: 8 }),
    supabase
      .from("expenses")
      .select("id, description, vendor, amount_cents, spent_at, expense_state")
      .eq("org_id", session.orgId)
      .is("department", null)
      .is("xtc_code", null)
      .neq("expense_state", "rejected")
      .order("spent_at", { ascending: false })
      .limit(8),
  ]);

  // Roll budget lines up by cost code (XPMS department; `code` fallback).
  type BudgetRow = {
    code: string | null;
    department: string | null;
    xtc_code: number | null;
    name: string;
    amount_cents: number;
    committed_cents: number;
    spent_cents: number;
    actual_cents: number | null;
  };
  const uncodedLabel = t("m.finance.uncodedCode", undefined, "Uncoded");
  const byCode = new Map<string, { label: string; budget: number; committed: number; actual: number }>();
  for (const r of (budgetRows ?? []) as BudgetRow[]) {
    const base = r.department ?? r.code ?? uncodedLabel;
    const label = r.xtc_code != null ? `${r.xtc_code} · ${base}` : base;
    const cur = byCode.get(label) ?? { label, budget: 0, committed: 0, actual: 0 };
    cur.budget += r.amount_cents;
    cur.committed += r.committed_cents;
    cur.actual += r.actual_cents ?? r.spent_cents;
    byCode.set(label, cur);
  }
  const codes = Array.from(byCode.values()).sort((a, b) => a.label.localeCompare(b.label));
  const totals = codes.reduce(
    (acc, c) => ({ budget: acc.budget + c.budget, committed: acc.committed + c.committed, actual: acc.actual + c.actual }),
    { budget: 0, committed: 0, actual: 0 },
  );

  type UncodedRow = {
    id: string;
    description: string;
    vendor: string | null;
    amount_cents: number;
    spent_at: string;
    expense_state: string;
  };
  const uncoded = (uncodedRows ?? []) as UncodedRow[];

  // Translated labels for the requisition states this list can carry (same
  // keys the /m/requisitions view uses); toTitle stays the fallback.
  const REQ_STATE_LABEL: Record<string, string> = {
    draft: t("m.reqs.state.draft", undefined, "Draft"),
    submitted: t("m.reqs.state.submitted", undefined, "Submitted"),
    approved: t("m.reqs.state.approved", undefined, "Approved"),
    rejected: t("m.reqs.state.rejected", undefined, "Rejected"),
    ordered: t("m.reqs.state.ordered", undefined, "Ordered"),
  };

  const na = "—";

  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="finance" active="budget" canManage />
      <div className="hint" style={{ marginBottom: 12 }}>
        {project
          ? t("m.finance.eyebrowProject", { project: project.name }, `${project.name} · Managed In ATLVS`)
          : t("m.finance.eyebrowOrg", undefined, "Org Wide · Managed In ATLVS")}
      </div>

      {/* Totals row. */}
      <div className="rec-grid">
        <div className="rec-cell">
          <div className="rec-k">{t("m.finance.totalBudget", undefined, "Budget")}</div>
          <div className="rec-v">{totals.budget ? fmt.money(totals.budget) : na}</div>
        </div>
        <div className="rec-cell">
          <div className="rec-k">{t("m.finance.totalCommitted", undefined, "Committed")}</div>
          <div className="rec-v">{totals.budget ? fmt.money(totals.committed) : na}</div>
        </div>
        <div className="rec-cell">
          <div className="rec-k">{t("m.finance.totalActual", undefined, "Actual")}</div>
          <div className="rec-v">{totals.budget ? fmt.money(totals.actual) : na}</div>
        </div>
        <div className="rec-cell">
          <div className="rec-k">{t("m.finance.totalRemaining", undefined, "Remaining")}</div>
          <div className="rec-v" style={{ color: "var(--p-success)" }}>
            {totals.budget ? fmt.money(totals.budget - totals.committed) : na}
          </div>
        </div>
      </div>

      {/* Quick actions. */}
      <div className="qa" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 4 }}>
        <Link href="/m/requisitions/new" style={{ textDecoration: "none" }}>
          <span
            className="qi"
            style={{ background: "color-mix(in oklab, var(--p-info) 16%, transparent)", color: "var(--p-info)" }}
          >
            <KIcon name="FileBox" size={18} />
          </span>
          <span className="ql">{t("m.finance.qaNewPo", undefined, "New PO")}</span>
        </Link>
        <Link href="/m/scan?mode=scanner&kind=invoice" style={{ textDecoration: "none" }}>
          <span
            className="qi"
            style={{ background: "color-mix(in oklab, var(--p-warning) 16%, transparent)", color: "var(--p-warning)" }}
          >
            <KIcon name="ReceiptText" size={18} />
          </span>
          <span className="ql">{t("m.finance.qaScanInvoice", undefined, "Scan Invoice")}</span>
        </Link>
        <Link href="/m/expenses/new" style={{ textDecoration: "none" }}>
          <span
            className="qi"
            style={{ background: "color-mix(in oklab, var(--p-success) 14%, transparent)", color: "var(--p-success)" }}
          >
            <KIcon name="Receipt" size={18} />
          </span>
          <span className="ql">{t("m.finance.qaExpense", undefined, "Expense")}</span>
        </Link>
      </div>

      {/* Per-cost-code committed vs actual bars. */}
      <div className="sech">
        <h2>{t("m.finance.byCostCode", undefined, "By Cost Code")}</h2>
      </div>
      {codes.length === 0 ? (
        <div className="item">
          <div className="s">
            {project
              ? t("m.finance.noBudget", undefined, "No budget lines on this project yet. Budgets are authored in ATLVS.")
              : t("m.finance.noBudgetOrg", undefined, "No budget lines yet. Budgets are authored in ATLVS.")}
          </div>
        </div>
      ) : (
        codes.map((c) => {
          const pctC = c.budget > 0 ? Math.min(100, Math.round((c.committed / c.budget) * 100)) : 0;
          const pctA = c.budget > 0 ? Math.min(100, Math.round((c.actual / c.budget) * 100)) : 0;
          const hot = c.budget > 0 && c.committed / c.budget > 0.85;
          return (
            <div className="w full" key={c.label} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span className="t" style={{ fontSize: 13.5, fontFamily: "var(--p-mono)" }}>
                  {c.label}
                </span>
                <span className="s" style={{ fontSize: 11 }}>
                  {t(
                    "m.finance.committedOf",
                    { committed: fmt.money(c.committed), budget: fmt.money(c.budget) },
                    `${fmt.money(c.committed)} of ${fmt.money(c.budget)}`,
                  )}
                  {hot && (
                    <>
                      {" · "}
                      <span style={{ color: "var(--p-warning)", fontWeight: 700 }}>{pctC}%</span>
                    </>
                  )}
                </span>
              </div>
              <div className="qr-ttl-bar" style={{ height: 7, position: "relative" }}>
                <span
                  style={{
                    width: `${pctC}%`,
                    background: hot ? "var(--p-warning)" : "color-mix(in oklab, var(--p-accent) 45%, var(--p-border))",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    inset: "0 auto 0 0",
                    display: "block",
                    width: `${pctA}%`,
                    background: hot ? "var(--p-warning)" : "var(--p-accent)",
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          );
        })
      )}
      {codes.length > 0 && (
        <div className="hint" style={{ margin: "2px 0 4px" }}>
          {t(
            "m.finance.barHint",
            undefined,
            "Solid = actual · tint = committed. Full budget management lives in ATLVS.",
          )}
        </div>
      )}

      {/* Purchase orders. */}
      <div className="sech">
        <h2>{t("m.finance.pos", undefined, "Purchase Orders")}</h2>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--p-text-3)" }}>{pos.length}</span>
      </div>
      {pos.length === 0 ? (
        <div className="item">
          <div className="s">{t("m.finance.noPos", undefined, "No purchase orders yet.")}</div>
        </div>
      ) : (
        pos.map((p) => (
          <Link href="/m/requisitions" className="item tap" key={p.id} style={{ textDecoration: "none" }}>
            <span className="more-ic">
              <KIcon name="FileBox" size={17} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="t">
                {p.title}
                {p.qty && p.qty > 1 ? ` ×${p.qty}` : ""}
              </div>
              <div className="s">
                {p.vendorName ? `${p.vendorName} · ` : ""}
                {p.estimatedCents != null ? `${fmt.money(p.estimatedCents)} · ` : ""}
                {p.costCode ?? t("m.finance.autoCode", undefined, "Auto-Code")}
              </div>
            </div>
            <span className={`ps-badge ps-badge--${PO_TONE[p.requisitionState] ?? "neutral"}`}>
              {REQ_STATE_LABEL[p.requisitionState] ?? toTitle(p.requisitionState)}
            </span>
          </Link>
        ))
      )}

      {/* Uncoded spend → the scanner coding flow. */}
      <div className="sech">
        <h2>{t("m.finance.uncoded", undefined, "Uncoded Spend")}</h2>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--p-text-3)" }}>{uncoded.length}</span>
      </div>
      {uncoded.length === 0 ? (
        <div className="item">
          <div className="s">{t("m.finance.noUncoded", undefined, "Nothing waiting on a cost code.")}</div>
        </div>
      ) : (
        uncoded.map((v) => (
          <Link
            href={`/m/scan?mode=scanner&kind=invoice&expense=${v.id}`}
            key={v.id}
            className="item tap"
            style={{ textDecoration: "none" }}
          >
            <span className="more-ic" style={{ color: "var(--p-warning)" }}>
              <KIcon name="ReceiptText" size={17} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="t">{v.vendor || v.description}</div>
              <div className="s">
                {fmt.money(v.amount_cents)} · {fmt.date(v.spent_at)}
              </div>
            </div>
            <span className="ps-badge ps-badge--warn">{t("m.finance.codeIt", undefined, "Code It")}</span>
          </Link>
        ))
      )}

      <FinanceSyncButton />
    </div>
  );
}
