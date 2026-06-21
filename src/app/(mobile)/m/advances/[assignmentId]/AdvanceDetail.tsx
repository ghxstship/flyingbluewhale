"use client";

import { useRouter } from "next/navigation";
import { RecordDetail } from "@/components/mobile/kit";
import type { RecordField } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";

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

export function AdvanceDetail({ data }: { data: AdvanceDetailData }) {
  const t = useT();
  const router = useRouter();

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
