"use client";

import Link from "next/link";
import { HubChrome } from "@/components/mobile/HubChrome";
import { Fab, KIcon, NormalizedList, type FieldDef } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

export type ExpenseRow = {
  id: string;
  description: string;
  amount: string;
  state: string;
  spent: string;
  hasReceipt: boolean;
};

const STATE_TONE: Record<string, string> = {
  pending: "warn",
  approved: "ok",
  rejected: "danger",
  reimbursed: "ok",
  cancelled: "neutral",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Kit 34 v3.4 — normalized (NormalizedList: search + View Options/Share drawers
 *  + schema DataView list/table/board + receipt pills). Board columns = the
 *  reimbursement lifecycle. Keeps the coding-warning banner + File-Expense FAB. */
export function ExpensesView({
  rows,
  warning,
  canManage = false,
}: {
  rows: ExpenseRow[];
  warning: string | null;
  eyebrow?: string;
  title?: string;
  canManage?: boolean;
}) {
  const t = useT();

  const states = [...new Set(rows.map((r) => cap(r.state)))];
  const boardTone: Record<string, string> = {};
  for (const r of rows) boardTone[cap(r.state)] = STATE_TONE[r.state] ?? "neutral";

  const FIELDS: FieldDef<ExpenseRow>[] = [
    { id: "description", label: "Expense", type: "text", get: (r) => r.description },
    { id: "state", label: "Status", type: "select", options: states, get: (r) => cap(r.state) },
    { id: "receipt", label: "Receipt", type: "select", options: ["Has Receipt", "No Receipt"], get: (r) => (r.hasReceipt ? "Has Receipt" : "No Receipt") },
    { id: "amount", label: "Amount", type: "text", get: (r) => r.amount },
    { id: "spent", label: "Spent", type: "text", get: (r) => r.spent },
  ];

  const row = (r: ExpenseRow) => (
    <div className="item" key={r.id} style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <KIcon name="Receipt" size={18} style={{ color: "var(--p-text-2)", flex: "none", marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{r.description}</div>
          <div className="s">
            {r.spent}
            {r.hasReceipt ? "" : ` · ${t("m.expenses.noReceipt", undefined, "No receipt")}`}
          </div>
        </div>
        <div style={{ textAlign: "right", flex: "none" }}>
          <div className="t" style={{ fontVariantNumeric: "tabular-nums" }}>
            {r.amount}
          </div>
          <span className={`ps-badge ps-badge--${STATE_TONE[r.state] ?? "neutral"}`}>{cap(r.state)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="finance" active="expenses" canManage={canManage} />

      {warning && (
        <div className="ps-alert ps-alert--warning" role="status" style={{ marginBottom: 12 }}>
          {warning}
        </div>
      )}

      <Link
        href="/m/expenses/new"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginBottom: 12 }}
      >
        <KIcon name="Receipt" size={16} /> {t("m.expenses.new", undefined, "File An Expense")}
      </Link>

      <NormalizedList
        k="ex"
        items={rows}
        fields={FIELDS}
        search={(r) => `${r.description} ${r.state} ${r.amount}`}
        searchPlaceholder={t("m.expenses.search", undefined, "Search Expenses…")}
        renderRow={row}
        views={["list", "table", "board"]}
        statusField="state"
        statusOrder={states}
        boardTone={boardTone}
        pill={{ get: (r) => (r.hasReceipt ? "Has Receipt" : "No Receipt"), order: ["Has Receipt", "No Receipt"] }}
        empty={{
          cols: ["Expense", "Amount", "Status"],
          title: t("m.expenses.empty.title", undefined, "No Expenses Yet"),
          hint: t(
            "m.expenses.empty.body",
            undefined,
            "Photograph the receipt while you still have it. Your expenses and their status live here.",
          ),
        }}
      />

      {/* Kit-29 spec: FAB = New Expense. */}
      <Fab href="/m/expenses/new" label={t("m.expenses.new", undefined, "File An Expense")} />
    </div>
  );
}
