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

  return (
    <>
      <ModuleHeader
        eyebrow="Discount Code"
        title={code.code}
        subtitle={`${DISCOUNT_KIND_LABELS[code.kind]} — ${formatDiscountValue(code.kind, code.value)}`}
        breadcrumbs={[
          { label: "Marketplace", href: "/console/marketplace" },
          { label: "Discounts", href: "/console/marketplace/discounts" },
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
              confirm={`Delete discount code "${code.code}"?`}
            />
          </div>
        }
      />
      <div className="page-content space-y-8">
        <div className="metric-grid">
          <MetricCard label="Redeemed" value={String(code.redeemed_count)} accent />
          <MetricCard label="Limit" value={code.max_redemptions ? String(code.max_redemptions) : "∞"} />
          <MetricCard
            label="Remaining"
            value={
              code.max_redemptions
                ? String(Math.max(0, code.max_redemptions - code.redeemed_count))
                : "∞"
            }
          />
        </div>

        <div className="metric-grid">
          <Field label="State">
            <StatusBadge status={code.discount_state} />
          </Field>
          <Field label="Value">{formatDiscountValue(code.kind, code.value)}</Field>
          <Field label="Exhausted">
            {isRedemptionExhausted(code.max_redemptions, code.redeemed_count) ? "Yes" : "No"}
          </Field>
          <Field label="Starts">{code.starts_at ? timeAgo(code.starts_at) : "—"}</Field>
          <Field label="Ends">{code.ends_at ? timeAgo(code.ends_at) : "—"}</Field>
          <Field label="Added">{timeAgo(code.created_at)}</Field>
        </div>

        {code.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Notes</h3>
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
