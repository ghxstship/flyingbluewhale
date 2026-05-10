import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  public_handle: string;
  name: string;
  tagline: string | null;
  bio: string | null;
  roles: string[];
  unions: string[];
  certifications: string[];
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  travel_radius_km: number | null;
  availability_open: boolean;
  rating_avg: number | null;
  rating_count: number;
  is_verified: boolean;
  reel_url: string | null;
  photo_url: string | null;
};

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!hasSupabase) return notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("public_crew_directory").select("*").eq("public_handle", handle).maybeSingle();
  if (!data) return notFound();
  const c = data as Row;

  return (
    <main className="page-content space-y-6">
      <Breadcrumbs
        items={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Crew", href: "/marketplace/crew" },
          { label: c.name },
        ]}
      />
      <header className="space-y-2">
        <p className="eyebrow">@{c.public_handle}</p>
        <div className="flex items-start gap-2">
          <h1 className="hed-2xl">{c.name}</h1>
          {c.is_verified && <Badge variant="success">verified</Badge>}
          {c.availability_open && <Badge variant="info">Available</Badge>}
        </div>
        {c.tagline && <p className="text-base text-[var(--text-secondary)]">{c.tagline}</p>}
      </header>

      {c.bio && (
        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Bio</h2>
          <div className="text-sm whitespace-pre-wrap">{c.bio}</div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Roles</h2>
          <div className="flex flex-wrap gap-1.5">
            {c.roles.length === 0 ? (
              <span className="text-sm text-[var(--text-secondary)]">—</span>
            ) : (
              c.roles.map((r) => (
                <Badge key={r} variant="muted">
                  {r}
                </Badge>
              ))
            )}
          </div>
        </div>
        <div className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Unions</h2>
          <div className="flex flex-wrap gap-1.5">
            {c.unions.length === 0 ? (
              <span className="text-sm text-[var(--text-secondary)]">—</span>
            ) : (
              c.unions.map((u) => (
                <Badge key={u} variant="muted">
                  {u}
                </Badge>
              ))
            )}
          </div>
        </div>
        <div className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Certs</h2>
          <div className="flex flex-wrap gap-1.5">
            {c.certifications.length === 0 ? (
              <span className="text-sm text-[var(--text-secondary)]">—</span>
            ) : (
              c.certifications.map((cert) => (
                <Badge key={cert} variant="muted">
                  {cert}
                </Badge>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Booking</h2>
        <dl className="space-y-1 text-sm">
          <div>
            <span className="text-[var(--text-secondary)]">Day rate:</span>{" "}
            {formatFeeRange(c.day_rate_min_cents, c.day_rate_max_cents, "USD")}
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Travel radius:</span>{" "}
            {c.travel_radius_km ? `${c.travel_radius_km} km` : "—"}
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Reel:</span>{" "}
            {c.reel_url ? (
              <a href={c.reel_url} target="_blank" rel="noopener" className="font-mono text-[var(--org-primary)]">
                Watch ↗
              </a>
            ) : (
              "—"
            )}
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Rating:</span>{" "}
            {c.rating_avg == null ? "no reviews yet" : `★ ${c.rating_avg} (${c.rating_count})`}
          </div>
        </dl>
      </section>

      <div className="flex items-center gap-3">
        <Button href={`/login?redirect=/marketplace/crew/${c.public_handle}/inquire`}>Send Inquiry</Button>
        <Button href="/signup" variant="ghost">
          Need an account?
        </Button>
      </div>
    </main>
  );
}
