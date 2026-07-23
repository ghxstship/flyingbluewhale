import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  formatDiscountValue,
  DISCOUNT_KIND_LABELS,
  DISCOUNT_STATES,
  DISCOUNT_STATE_LABELS,
  isRedemptionExhausted,
  type DiscountKind,
  type DiscountState,
} from "@/lib/discounts_promoters";
import { getRequestT } from "@/lib/i18n/request";
import { deleteDiscountAction, setDiscountStateAction } from "../actions";

export const dynamic = "force-dynamic";

type Discount = {
  id: string;
  code: string;
  kind: DiscountKind;
  value: number;
  max_redemptions: number | null;
  redeemed_count: number;
  discount_state: DiscountState;
  starts_at: string | null;
  ends_at: string | null;
  notes: string | null;
  created_at: string;
};

export default async function DiscountDetail({ params }: { params: Promise<{ discountId: string }> }) {
  const { discountId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("discount_codes")
    .select(
      "id, code, kind, value, max_redemptions, redeemed_count, discount_state, starts_at, ends_at, notes, created_at",
    )
    .eq("id", discountId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const code = (data ?? null) as Discount | null;
  if (!code) notFound();
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.discounts.detail.eyebrow", undefined, "Discount Code")}
        title={code.code}
        subtitle={`${DISCOUNT_KIND_LABELS[code.kind]} — ${formatDiscountValue(code.kind, code.value)}`}
        breadcrumbs={[
          {
            label: t("console.marketplace.discounts.breadcrumb.marketplace", undefined, "Marketplace"),
            href: "/studio/marketplace",
          },
          {
            label: t("console.marketplace.discounts.title", undefined, "Discounts"),
            href: "/studio/marketplace/discounts",
          },
          { label: code.code },
        ]}
        action={
          <div className="flex items-center gap-2">
            {DISCOUNT_STATES.filter((s) => s !== code.discount_state).map((s) => (
              <form key={s} action={setDiscountStateAction.bind(null, code.id, s)}>
                <Button type="submit" size="sm" variant="secondary">
                  {DISCOUNT_STATE_LABELS[s]}
                </Button>
              </form>
            ))}
            <DeleteForm
              action={deleteDiscountAction.bind(null, code.id)}
              confirm={t(
                "console.marketplace.discounts.detail.deleteConfirm",
                { code: code.code },
                `Delete discount code "${code.code}"?`,
              )}
              undo={{ table: "discount_codes", id: code.id, redirectTo: "/studio/marketplace/discounts" }}
            />
          </div>
        }
      />
      <div className="page-content space-y-8">
        <div className="metric-grid">
          <MetricCard
            label={t("console.marketplace.discounts.detail.metrics.redeemed", undefined, "Redeemed")}
            value={String(code.redeemed_count)}
            accent
          />
          <MetricCard
            label={t("console.marketplace.discounts.detail.metrics.limit", undefined, "Limit")}
            value={code.max_redemptions ? String(code.max_redemptions) : "∞"}
          />
          <MetricCard
            label={t("console.marketplace.discounts.detail.metrics.remaining", undefined, "Remaining")}
            value={
              code.max_redemptions
                ? String(Math.max(0, code.max_redemptions - code.redeemed_count))
                : "∞"
            }
          />
        </div>

        <div className="metric-grid">
          <Field label={t("console.marketplace.discounts.detail.fields.status", undefined, "Status")}>
            <StatusBadge status={code.discount_state} />
          </Field>
          <Field label={t("console.marketplace.discounts.detail.fields.value", undefined, "Value")}>
            {formatDiscountValue(code.kind, code.value)}
          </Field>
          <Field label={t("console.marketplace.discounts.detail.fields.exhausted", undefined, "Exhausted")}>
            {isRedemptionExhausted(code.max_redemptions, code.redeemed_count)
              ? t("console.marketplace.discounts.detail.yes", undefined, "Yes")
              : t("console.marketplace.discounts.detail.no", undefined, "No")}
          </Field>
          <Field label={t("console.marketplace.discounts.detail.fields.starts", undefined, "Starts")}>
            {code.starts_at ? timeAgo(code.starts_at) : "—"}
          </Field>
          <Field label={t("console.marketplace.discounts.detail.fields.ends", undefined, "Ends")}>
            {code.ends_at ? timeAgo(code.ends_at) : "—"}
          </Field>
          <Field label={t("console.marketplace.discounts.detail.fields.added", undefined, "Added")}>
            {timeAgo(code.created_at)}
          </Field>
        </div>

        {code.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">
              {t("console.marketplace.discounts.detail.notes", undefined, "Notes")}
            </h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{code.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
