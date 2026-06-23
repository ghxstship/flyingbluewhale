"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RecordDetail } from "@/components/mobile/kit";
import type { RecordAction, RecordField } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { fulfillAssignment } from "./actions";

export type AdvanceDetailData = {
  id: string;
  title: string | null;
  catalogKindLabel: string;
  catalogKindIcon: string;
  fulfillmentState: string;
  stateTone: string;
  project: string | null;
  deadline: string | null;
  issuedAt: string | null;
  fulfilledAt: string | null;
  notes: string | null;
  qty: number | null;
  special: string | null;
  purpose: string | null;
};

function stateLabel(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Manager-facing label for the lifecycle action that lands each next state.
const TRANSITION_LABEL: Record<string, string> = {
  submitted: "Submit",
  in_review: "Send to Review",
  approved: "Approve",
  rejected: "Reject",
  revision_requested: "Request Revision",
  issued: "Issue",
  delivered: "Mark Delivered",
  transferred: "Transfer",
  redeemed: "Fulfill",
  returned: "Mark Returned",
  expired: "Mark Expired",
  voided: "Void",
};

export function AdvanceDetail({
  data,
  canManage = false,
  nextStates = [],
}: {
  data: AdvanceDetailData;
  canManage?: boolean;
  nextStates?: string[];
}) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const transition = (nextState: string) => {
    setBusy(nextState);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("assignmentId", data.id);
      fd.set("nextState", nextState);
      const res = await fulfillAssignment(null, fd);
      setBusy(null);
      if (res?.error) {
        toast.error(t("m.advances.fulfill.error", undefined, "Couldn't update"), { description: res.error });
        return;
      }
      toast.success(
        t("m.advances.fulfill.done", undefined, "Updated"),
        { description: TRANSITION_LABEL[nextState] ?? stateLabel(nextState) },
      );
      router.refresh();
    });
  };

  const manageActions: RecordAction[] = canManage
    ? nextStates.map((s) => ({
        label: pending && busy === s ? t("m.advances.fulfill.working", undefined, "Working…") : (TRANSITION_LABEL[s] ?? stateLabel(s)),
        icon: s === "redeemed" || s === "delivered" ? "ScanLine" : s === "rejected" || s === "voided" ? "X" : "Check",
        primary: s === "approved" || s === "issued" || s === "redeemed" || s === "delivered",
        danger: s === "rejected" || s === "voided",
        on: () => transition(s),
      }))
    : [];

  const fields: RecordField[] = [
    { k: t("m.advances.detail.type", undefined, "Type"), v: data.catalogKindLabel },
    { k: t("m.advances.detail.state", undefined, "State"), v: stateLabel(data.fulfillmentState) },
  ];
  if (data.project) fields.push({ k: t("m.advances.detail.project", undefined, "Project"), v: data.project });
  if (data.qty != null) fields.push({ k: t("m.advances.detail.qty", undefined, "Quantity"), v: String(data.qty) });
  if (data.deadline) fields.push({ k: t("m.advances.detail.due", undefined, "Due"), v: data.deadline });
  if (data.issuedAt) fields.push({ k: t("m.advances.detail.issued", undefined, "Issued"), v: data.issuedAt });
  if (data.fulfilledAt) fields.push({ k: t("m.advances.detail.fulfilled", undefined, "Fulfilled"), v: data.fulfilledAt });
  if (data.special) fields.push({ k: t("m.advances.detail.special", undefined, "Special Requests"), v: data.special, full: true });
  if (data.purpose) fields.push({ k: t("m.advances.detail.purpose", undefined, "Operational Purpose"), v: data.purpose, full: true });

  return (
    <div className="screen screen-anim">
      <RecordDetail
        eyebrow={t("m.advances.detail.eyebrow", undefined, "Advance · Item")}
        title={data.title ?? data.catalogKindLabel}
        icon={data.catalogKindIcon}
        status={{ tone: data.stateTone, label: stateLabel(data.fulfillmentState) }}
        fields={fields}
        actions={manageActions}
        sections={
          data.notes
            ? [{ h: t("m.advances.detail.notes", undefined, "Notes"), text: data.notes }]
            : []
        }
        onClose={() => router.push("/m/advances")}
      />
    </div>
  );
}
