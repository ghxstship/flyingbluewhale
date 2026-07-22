"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HubChrome } from "@/components/mobile/HubChrome";
import { Fab, KIcon, NormalizedList, RecordDetail, FormScreen, type FieldDef, type FormDef } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { toFormData } from "@/lib/mobile/form-data";
import { updateExpense, deleteExpense, type State } from "./actions";

export type ExpenseRow = {
  id: string;
  description: string;
  amount: string;
  /** Raw editable values (display strings above are formatted). */
  amountInput: string;
  spentIso: string;
  state: string;
  spent: string;
  hasReceipt: boolean;
};

/** A claim is the submitter's to change only until finance settles it. */
const MUTABLE = new Set(["pending", "rejected"]);

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
  const router = useRouter();
  const toast = useToast();
  const [detail, setDetail] = useState<ExpenseRow | null>(null);
  const [editing, setEditing] = useState<ExpenseRow | null>(null);
  const [, startTx] = useTransition();

  const editForm: FormDef = {
    title: t("m.expenses.edit", undefined, "Correct Expense"),
    icon: "Receipt",
    submit: t("m.expenses.save", undefined, "Save Changes"),
    // Amount + date only: the description is stored composed and the category
    // is a finance-owned code, so neither is safe to round-trip from here.
    intro: t("m.expenses.editIntro", undefined, "Correct the amount or the date. Re-coding a claim stays with finance."),
    fields: [
      { id: "amount", label: t("m.expenses.amount", undefined, "Amount"), type: "text", required: true },
      { id: "date", label: t("m.expenses.date", undefined, "Date"), type: "date" },
    ],
  };

  const onEditSubmit = (_def: FormDef, vals: Record<string, unknown>) => {
    const target = editing;
    if (!target) return;
    startTx(async () => {
      const res: State = await updateExpense(
        null,
        toFormData({ id: target.id, amount: String(vals.amount ?? ""), date: String(vals.date ?? "") }),
      );
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setEditing(null);
      setDetail(null);
      router.refresh();
    });
  };

  const onWithdraw = (r: ExpenseRow) => {
    startTx(async () => {
      const res: State = await deleteExpense(null, toFormData({ id: r.id }));
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setDetail(null);
      router.refresh();
    });
  };

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
    <div
      className="item tap"
      key={r.id}
      style={{ display: "block" }}
      role="button"
      tabIndex={0}
      onClick={() => setDetail(r)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetail(r); } }}
    >
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

  if (editing) {
    return (
      <FormScreen
        def={editForm}
        initial={{ amount: editing.amountInput, date: editing.spentIso }}
        onClose={() => setEditing(null)}
        onSubmit={onEditSubmit}
      />
    );
  }

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
        onRow={setDetail}
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

      {detail && (
        <RecordDetail
          title={detail.description}
          icon="Receipt"
          status={{ tone: STATE_TONE[detail.state] ?? "neutral", label: cap(detail.state) }}
          fields={[
            { k: t("m.expenses.amount", undefined, "Amount"), v: detail.amount },
            { k: t("m.expenses.spent", undefined, "Spent"), v: detail.spent },
            {
              k: t("m.expenses.receipt", undefined, "Receipt"),
              v: detail.hasReceipt
                ? t("m.expenses.receiptOn", undefined, "Attached")
                : t("m.expenses.noReceipt", undefined, "No receipt"),
            },
          ]}
          // Once finance approves or reimburses, the claim is settled — the
          // actions disappear rather than being offered and then refused.
          actions={
            MUTABLE.has(detail.state)
              ? [
                  { label: t("m.expenses.edit", undefined, "Correct Expense"), icon: "Pencil", primary: true, on: () => setEditing(detail) },
                  {
                    label: t("m.expenses.withdraw", undefined, "Withdraw Claim"),
                    icon: "Trash2",
                    danger: true,
                    confirmText: t("m.expenses.withdrawConfirm", undefined, "Withdraw this claim? It's removed from your expenses."),
                    on: () => onWithdraw(detail),
                  },
                ]
              : []
          }
          onClose={() => setDetail(null)}
        />
      )}

      {/* Kit-29 spec: FAB = New Expense. */}
      <Fab href="/m/expenses/new" label={t("m.expenses.new", undefined, "File An Expense")} />
    </div>
  );
}
