import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatFeeRange } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

/**
 * Mobile open-gigs surface — crew on the road browse the same public
 * job board that lives at `/marketplace/gigs`, formatted for thumb reach.
 * Reads from the `public_job_board` view (anon GRANT SELECT). The
 * authenticated mobile shell still hits this view; RLS is irrelevant
 * because the view filters to `status='published'` upstream.
 */
type Row = {
  id: string;
  public_slug: string;
  title: string;
  role_taxonomy: string[];
  region: string | null;
  city: string | null;
  country: string | null;
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  currency: string;
  posting_type: string;
  union_required: string[];
  travel_paid: boolean;
  lodging_provided: boolean;
  applicant_count: number;
  org_name: string;
};

export default async function Page() {
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_job_board")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(40);
    rows = (data ?? []) as Row[];
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-label text-[var(--brand-color)]">Marketplace</div>
      <h1 className="text-display mt-2 text-3xl">Open Gigs</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        {rows.length} live gig{rows.length === 1 ? "" : "s"} across the network.
      </p>

      {rows.length === 0 ? (
        <div className="card-elevated mt-6 p-6 text-sm text-[var(--color-text-secondary)]">
          No live gigs at the moment.
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="card-elevated p-4">
              <Link href={`/marketplace/gigs/${r.public_slug}`} className="block">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold">{r.title}</span>
                  <span className="text-xs whitespace-nowrap text-[var(--color-text-secondary)]">
                    {formatFeeRange(r.day_rate_min_cents, r.day_rate_max_cents, r.currency)}/day
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {r.org_name}
                  {r.city || r.region ? ` · ${[r.city, r.region].filter(Boolean).join(", ")}` : ""}
                  {r.travel_paid ? " · travel paid" : ""}
                </p>
                {r.role_taxonomy.length > 0 && (
                  <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                    {r.role_taxonomy.slice(0, 3).join(" · ")}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
