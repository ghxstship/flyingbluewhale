"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NormalizedList, KIcon, RecordDetail, type FieldDef, toneToBadge } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { toFormData } from "@/lib/mobile/form-data";
import { withdrawRequisition, type State } from "./actions";

/**
 * Purchase Requests — the viewer's own requisitions, on the kit view engine
 * (NormalizedList: search + View Options / Share & Export drawers +
 * list/table/board views). Status is the board column + row badge, never a
 * quick-filter pill (repo canon). The estimate is a sortable numeric field.
 *
 * A row opens its record, where the requester can withdraw it: raising a
 * request was the only thing the field could do, so one sent in error sat in
 * the approver's queue with no way to pull it back.
 */
export type RequisitionItem = {
  id: string;
  title: string;
  description: string | null;
  requisition_state: string;
  estimatedCents: number | null;
  estimatedLabel: string | null;
  createdLabel: string;
};

/** Tone keyed by the RAW state — the display label is locale-dependent. */
const STATE_TONE: Record<string, string> = {
  draft: "text-3",
  submitted: "warning",
  approved: "success",
  rejected: "danger",
  ordered: "info",
};
const RAW_STATE_ORDER = ["draft", "submitted", "approved", "rejected", "ordered"];
/** Raw states the requester may still withdraw (mirrors the server guard). */
const WITHDRAWABLE = new Set(["draft", "submitted", "rejected"]);

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  // Tone → class mapping is the kit's toneToBadge SSOT (was a per-surface ternary).
  return <span className={toneToBadge(tone)}>{children}</span>;
}

export function RequisitionsView({ items }: { items: RequisitionItem[] }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [detail, setDetail] = useState<RequisitionItem | null>(null);
  const [, startTx] = useTransition();

  const onWithdraw = (x: RequisitionItem) => {
    startTx(async () => {
      const res: State = await withdrawRequisition(null, toFormData({ id: x.id }));
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setDetail(null);
      router.refresh();
    });
  };

  const stateLabel: Record<string, string> = {
    draft: t("m.reqs.state.draft", undefined, "Draft"),
    submitted: t("m.reqs.state.submitted", undefined, "Submitted"),
    approved: t("m.reqs.state.approved", undefined, "Approved"),
    rejected: t("m.reqs.state.rejected", undefined, "Rejected"),
    ordered: t("m.reqs.state.ordered", undefined, "Ordered"),
  };
  const stateOf = (x: RequisitionItem) => stateLabel[x.requisition_state] ?? x.requisition_state;

  // Board columns + tones keyed by the TRANSLATED label the field emits —
  // keying them by the English label broke both in any other locale.
  const STATE_ORDER = RAW_STATE_ORDER.map((s) => stateLabel[s] ?? s);
  const boardTone: Record<string, string> = Object.fromEntries(
    RAW_STATE_ORDER.map((s) => [stateLabel[s] ?? s, STATE_TONE[s] ?? "text-3"]),
  );

  const fields: FieldDef<RequisitionItem>[] = [
    { id: "title", label: t("m.reqs.col.title", undefined, "Request"), type: "text", get: (x) => x.title },
    {
      id: "requisition_state",
      label: t("m.reqs.col.status", undefined, "Status"),
      type: "select",
      options: STATE_ORDER,
      get: stateOf,
    },
    {
      id: "estimate",
      label: t("m.reqs.col.estimate", undefined, "Estimate"),
      type: "num",
      get: (x) => x.estimatedCents ?? 0,
      cell: (x) => x.estimatedLabel ?? "—",
    },
  ];

  const row = (x: RequisitionItem) => (
    <div
      className="item tap"
      key={x.id}
      style={{ display: "block" }}
      role="button"
      tabIndex={0}
      onClick={() => setDetail(x)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDetail(x);
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{x.title}</div>
          <div className="s">{[x.estimatedLabel, x.createdLabel].filter(Boolean).join(" · ")}</div>
        </div>
        <Badge tone={STATE_TONE[x.requisition_state] ?? "neutral"}>{stateOf(x)}</Badge>
      </div>
      {x.description ? (
        <p className="form-intro" style={{ margin: "8px 0 0" }}>
          {x.description}
        </p>
      ) : null}
    </div>
  );

  return (
    <>
      <NormalizedList
        k="requisitions"
        items={items}
        fields={fields}
        search={(x) => `${x.title} ${x.description ?? ""}`}
        searchPlaceholder={t("m.reqs.search", undefined, "Search requests…")}
        renderRow={row}
        onRow={setDetail}
        views={["list", "table", "board"]}
        statusField="requisition_state"
        statusOrder={STATE_ORDER}
        boardTone={boardTone}
        empty={{
          cols: [
            t("m.reqs.col.title", undefined, "Request"),
            t("m.reqs.col.status", undefined, "Status"),
            t("m.reqs.col.estimate", undefined, "Estimate"),
          ],
          title: t("m.reqs.emptyTitle", undefined, "Nothing Requested"),
          hint: t(
            "m.reqs.emptyBody",
            undefined,
            "Need something bought for the job? Raise it here and your manager picks it up.",
          ),
        }}
        footer={
          <Link
            href="/m/requisitions/new"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ width: "100%", justifyContent: "center", marginTop: 16, textDecoration: "none" }}
          >
            <KIcon name="Plus" size={16} /> {t("m.reqs.new", undefined, "Request A Purchase")}
          </Link>
        }
      />
      {detail && (
        <RecordDetail
          title={detail.title}
          icon="ShoppingCart"
          status={{ tone: STATE_TONE[detail.requisition_state] ?? "neutral", label: stateOf(detail) }}
          fields={[
            { k: t("m.reqs.col.estimate", undefined, "Estimate"), v: detail.estimatedLabel ?? "—" },
            { k: t("m.reqs.col.raised", undefined, "Raised"), v: detail.createdLabel },
            ...(detail.description
              ? [{ k: t("m.reqs.col.purpose", undefined, "Purpose"), v: detail.description, full: true }]
              : []),
          ]}
          // Once approved/converted the request is procurement's record, not
          // the requester's — the action disappears rather than being refused.
          actions={
            WITHDRAWABLE.has(detail.requisition_state)
              ? [
                  {
                    label: t("m.reqs.withdraw", undefined, "Withdraw Request"),
                    icon: "Trash2",
                    danger: true,
                    confirmText: t(
                      "m.reqs.withdrawConfirm",
                      undefined,
                      "Withdraw this request? It leaves the approver's queue.",
                    ),
                    on: () => onWithdraw(detail),
                  },
                ]
              : []
          }
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
