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
import { formatMoney } from "@/lib/i18n/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  formatBps,
  PROMOTER_STATES,
  PROMOTER_STATE_LABELS,
  type PromoterState,
} from "@/lib/discounts_promoters";
import { deletePromoterAction, setPromoterStateAction } from "../actions";
import { AttributionForm } from "./AttributionForm";

export const dynamic = "force-dynamic";

type Promoter = {
  id: string;
  name: string;
  email: string | null;
  commission_bps: number;
  ref_code: string | null;
  promoter_state: PromoterState;
  notes: string | null;
  created_at: string;
};

type Attribution = {
  id: string;
  transaction_ref: string;
  amount_cents: number;
  commission_cents: number;
  occurred_at: string;
};

function dollars(cents: number): string {
  return formatMoney(cents);
}

export default async function PromoterDetail({ params }: { params: Promise<{ promoterId: string }> }) {
  const { promoterId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data: promoterData } = await db
    .from("promoters")
    .select("id, name, email, commission_bps, ref_code, promoter_state, notes, created_at")
    .eq("id", promoterId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const promoter = (promoterData ?? null) as Promoter | null;
  if (!promoter) notFound();

  const { data: attrData } = await db
    .from("promoter_attributions")
    .select("id, transaction_ref, amount_cents, commission_cents, occurred_at")
    .eq("org_id", session.orgId)
    .eq("promoter_id", promoterId)
    .order("occurred_at", { ascending: false })
    .limit(200);
  const attributions = (attrData ?? []) as Attribution[];

  const grossCents = attributions.reduce((s, a) => s + a.amount_cents, 0);
  const owedCents = attributions.reduce((s, a) => s + a.commission_cents, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Promoter"
        title={promoter.name}
        subtitle={`${formatBps(promoter.commission_bps)} commission${
          promoter.ref_code ? ` · ${promoter.ref_code}` : ""
        }`}
        breadcrumbs={[
          { label: "Marketplace", href: "/studio/marketplace" },
          { label: "Discounts", href: "/studio/marketplace/discounts" },
          { label: "Promoters", href: "/studio/marketplace/discounts/promoters" },
          { label: promoter.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            {PROMOTER_STATES.filter((s) => s !== promoter.promoter_state).map((s) => (
              <form key={s} action={setPromoterStateAction.bind(null, promoter.id, s)}>
                <Button type="submit" size="sm" variant="secondary">
                  {PROMOTER_STATE_LABELS[s]}
                </Button>
              </form>
            ))}
            <DeleteForm
              action={deletePromoterAction.bind(null, promoter.id)}
              confirm={`Delete promoter "${promoter.name}"? Attribution history is removed.`}
              undo={{
                table: "promoters",
                id: promoter.id,
                redirectTo: "/studio/marketplace/discounts/promoters",
              }}
            />
          </div>
        }
      />
      <div className="page-content space-y-8">
        <div className="metric-grid">
          <MetricCard label="Attributions" value={String(attributions.length)} accent />
          <MetricCard label="Gross Attributed" value={dollars(grossCents)} />
          <MetricCard label="Commission Owed" value={dollars(owedCents)} />
        </div>

        <div className="metric-grid">
          <Field label="Status">
            <StatusBadge status={promoter.promoter_state} />
          </Field>
          <Field label="Email">{promoter.email ?? "—"}</Field>
          <Field label="Ref Code">{promoter.ref_code ?? "—"}</Field>
          <Field label="Added">{timeAgo(promoter.created_at)}</Field>
        </div>

        {promoter.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Notes</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{promoter.notes}</p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-semibold tracking-wide uppercase">Record Attribution</h3>
          <div className="max-w-2xl">
            <AttributionForm promoterId={promoter.id} />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wide uppercase">Attribution Ledger</h3>
          {attributions.length === 0 ? (
            <div className="surface p-5 text-sm text-[var(--p-text-2)]">No attributions recorded yet.</div>
          ) : (
            <div className="surface overflow-hidden">
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Amount</th>
                    <th>Commission</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {attributions.map((a) => (
                    <tr key={a.id}>
                      <td className="font-mono">{a.transaction_ref}</td>
                      <td>{dollars(a.amount_cents)}</td>
                      <td>{dollars(a.commission_cents)}</td>
                      <td>{timeAgo(a.occurred_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
