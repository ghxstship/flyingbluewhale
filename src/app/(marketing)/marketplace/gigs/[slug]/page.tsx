import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  public_slug: string;
  title: string;
  description: string | null;
  role_taxonomy: string[];
  region: string | null;
  city: string | null;
  country: string | null;
  employment_type: string;
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  currency: string;
  posting_type: string;
  union_required: string[];
  certs_required: string[];
  travel_paid: boolean;
  lodging_provided: boolean;
  applicant_count: number;
  expires_at: string | null;
  org_name: string;
  org_slug: string;
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) return notFound();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase.from("public_job_board").select("*").eq("public_slug", slug).maybeSingle();
  if (!data) return notFound();
  const r = data as Row;

  return (
    <main className="page-content space-y-6">
      <Breadcrumbs
        items={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Crew Gigs", href: "/marketplace/gigs" },
          { label: r.title },
        ]}
      />
      <header className="space-y-2">
        <p className="eyebrow">Gig · {r.org_name}</p>
        <h1 className="hed-2xl">{r.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge variant="muted">{r.posting_type}</Badge>
          <Badge variant="muted">{r.employment_type.toUpperCase()}</Badge>
          {[r.city, r.region, r.country].filter(Boolean).length > 0 && (
            <Badge variant="muted">{[r.city, r.region, r.country].filter(Boolean).join(", ")}</Badge>
          )}
          <Badge variant="info">{formatFeeRange(r.day_rate_min_cents, r.day_rate_max_cents, r.currency)}/day</Badge>
        </div>
      </header>

      <section className="surface p-5">
        <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">About this gig</h2>
        <div className="text-sm whitespace-pre-wrap">{r.description ?? "—"}</div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Roles</h2>
          <div className="flex flex-wrap gap-1.5">
            {r.role_taxonomy.length === 0 ? (
              <span className="text-sm text-[var(--text-secondary)]">—</span>
            ) : (
              r.role_taxonomy.map((t) => (
                <Badge key={t} variant="muted">
                  {t}
                </Badge>
              ))
            )}
          </div>
        </div>
        <div className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Requirements</h2>
          <dl className="space-y-1 text-sm">
            <div>
              <span className="text-[var(--text-secondary)]">Unions:</span> {r.union_required.join(", ") || "—"}
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Certs:</span> {r.certs_required.join(", ") || "—"}
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Travel:</span> {r.travel_paid ? "Paid" : "Not paid"}
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Lodging:</span>{" "}
              {r.lodging_provided ? "Provided" : "Not provided"}
            </div>
          </dl>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button href={`/login?redirect=/marketplace/gigs/${r.public_slug}/apply`}>Apply</Button>
        <Button href="/signup" variant="ghost">
          Need an account?
        </Button>
        <span className="text-xs text-[var(--text-secondary)]">{r.applicant_count} applicants</span>
      </div>
    </main>
  );
}
