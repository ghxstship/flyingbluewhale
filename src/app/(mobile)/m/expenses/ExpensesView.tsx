"use client";

import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";

export type ExpenseRow = {
  id: string;
  description: string;
  amount: string;
  category: string | null;
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

export function ExpensesView({
  rows,
  warning,
  eyebrow,
  title,
}: {
  rows: ExpenseRow[];
  warning: string | null;
  eyebrow: string;
  title: string;
}) {
  const t = useT();

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

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

      {rows.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.expenses.empty.title", undefined, "No Expenses Yet")}
          description={t(
            "m.expenses.empty.body",
            undefined,
            "Photograph the receipt while you still have it. Your expenses and their status live here.",
          )}
        />
      ) : (
        rows.map((r) => (
          <div className="item" key={r.id} style={{ display: "block" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <KIcon name="Receipt" size={18} style={{ color: "var(--p-text-2)", flex: "none", marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{r.description}</div>
                <div className="s">
                  {r.spent}
                  {r.category ? ` · ${r.category}` : ""}
                  {/* Say it plainly when the receipt is missing: finance will
                      ask, and the person can still fix it today. */}
                  {r.hasReceipt ? "" : ` · ${t("m.expenses.noReceipt", undefined, "No receipt")}`}
                </div>
              </div>
              <div style={{ textAlign: "right", flex: "none" }}>
                <div className="t" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {r.amount}
                </div>
                <span className={`ps-badge ps-badge--${STATE_TONE[r.state] ?? "neutral"}`}>
                  {r.state.charAt(0).toUpperCase() + r.state.slice(1)}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
