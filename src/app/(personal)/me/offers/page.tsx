import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { STATUS_TONE } from "@/lib/marketplace";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Offer = {
  id: string;
  performance_date: string;
  fee_cents: number;
  currency: string;
  status: string;
  deposit_pct: number;
  talent_profile_id: string;
};

export default async function Page() {
  if (!hasSupabase) return <div>Configure Supabase.</div>;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const profilesResp = await supabase.from("talent_profiles").select("id").eq("user_id", session.userId);
  const profileIds = ((profilesResp.data ?? []) as Array<{ id: string }>).map((p) => p.id);

  let offers: Offer[] = [];
  if (profileIds.length > 0) {
    const { data } = await supabase
      .from("talent_offers")
      .select("id, performance_date, fee_cents, currency, status, deposit_pct, talent_profile_id")
      .in("talent_profile_id", profileIds)
      .order("performance_date", { ascending: false })
      .limit(200);
    offers = (data ?? []) as Offer[];
  }

  return (
    <div>
      <div className="text-label text-[var(--color-text-tertiary)]">My offers</div>
      <h1 className="text-display mt-1 text-3xl">Booking Offers</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Offers sent to acts you're attached to. Default 60/40, balance on load-in.
      </p>

      {offers.length === 0 ? (
        <div className="card-elevated mt-6 p-6 text-sm text-[var(--color-text-secondary)]">No offers yet.</div>
      ) : (
        <ul className="mt-6 space-y-2">
          {offers.map((o) => (
            <li key={o.id} className="card-elevated flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold">{o.performance_date}</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {formatMoney(o.fee_cents)} · {o.deposit_pct}% deposit
                </p>
              </div>
              <Badge variant={STATUS_TONE[o.status] ?? "muted"}>{o.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
