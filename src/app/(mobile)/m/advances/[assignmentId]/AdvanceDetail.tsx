"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RecordDetail } from "@/components/mobile/kit";
import type { RecordAction, RecordField } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { fulfillmentStateLabels, prettyState } from "../_shared";
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
  /** Kit 31 #4 — the advance window every line carries. */
  startsOn: string | null;
  endsOn: string | null;
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

  const stateLabels = fulfillmentStateLabels(t);
  const stateLabel = (s: string) => stateLabels[s] ?? prettyState(s);

  // Manager-facing label for the lifecycle action that lands each next state.
  const TRANSITION_LABEL: Record<string, string> = {
    submitted: t("m.advances.transition.submit", undefined, "Submit"),
    in_review: t("m.advances.transition.review", undefined, "Send to Review"),
    approved: t("m.advances.transition.approve", undefined, "Approve"),
    rejected: t("m.advances.transition.reject", undefined, "Reject"),
    revision_requested: t("m.advances.transition.revise", undefined, "Request Revision"),
    issued: t("m.advances.transition.issue", undefined, "Issue"),
    delivered: t("m.advances.transition.deliver", undefined, "Mark Delivered"),
    transferred: t("m.advances.transition.transfer", undefined, "Transfer"),
    redeemed: t("m.advances.transition.fulfill", undefined, "Fulfill"),
    returned: t("m.advances.transition.return", undefined, "Mark Returned"),
    expired: t("m.advances.transition.expire", undefined, "Mark Expired"),
    voided: t("m.advances.transition.void", undefined, "Void"),
  };

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
  if (data.startsOn) fields.push({ k: t("m.advances.detail.start", undefined, "Start Date"), v: data.startsOn });
  if (data.endsOn) fields.push({ k: t("m.advances.detail.end", undefined, "End Date"), v: data.endsOn });
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
        recent={{
          href: `/m/advances/${data.id}`,
          title: data.title ?? data.catalogKindLabel,
          kind: data.catalogKindIcon,
        }}
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
