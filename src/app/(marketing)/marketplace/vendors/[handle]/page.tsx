import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  public_handle: string;
  name: string;
  tagline: string | null;
  bio: string | null;
  logo_url: string | null;
  hero_url: string | null;
  website_url: string | null;
  trade_categories: string[];
  regions: string[];
  rating_avg: number | null;
  rating_count: number;
  is_verified: boolean;
  year_founded: number | null;
};

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  if (!hasSupabase) return notFound();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase.from("public_vendor_directory").select("*").eq("public_handle", handle).maybeSingle();
  if (!data) return notFound();
  const v = data as Row;

  return (
    <main className="page-content space-y-6">
      <Breadcrumbs
        items={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Vendors", href: "/marketplace/vendors" },
          { label: v.name },
        ]}
      />
      <header className="space-y-2">
        <p className="eyebrow">@{v.public_handle}</p>
        <div className="flex items-start gap-2">
          <h1 className="hed-2xl">{v.name}</h1>
          {v.is_verified && <Badge variant="success">verified</Badge>}
        </div>
        {v.tagline && <p className="text-base text-[var(--text-secondary)]">{v.tagline}</p>}
        <div className="flex flex-wrap gap-1.5">
          {v.trade_categories.map((t) => (
            <Badge key={t} variant="muted">
              {t}
            </Badge>
          ))}
        </div>
      </header>

      {v.bio && (
        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">About</h2>
          <div className="text-sm whitespace-pre-wrap">{v.bio}</div>
        </section>
      )}

      <section className="surface p-5">
        <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Coverage</h2>
        <dl className="space-y-1 text-sm">
          <div>
            <span className="text-[var(--text-secondary)]">Regions:</span> {v.regions.join(", ") || "—"}
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Founded:</span> {v.year_founded ?? "—"}
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Web:</span>{" "}
            {v.website_url ? (
              <a href={v.website_url} target="_blank" rel="noopener" className="font-mono text-[var(--org-primary)]">
                {v.website_url} ↗
              </a>
            ) : (
              "—"
            )}
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Rating:</span>{" "}
            {v.rating_avg == null ? "no reviews yet" : `★ ${v.rating_avg} (${v.rating_count})`}
          </div>
        </dl>
      </section>

      <div className="flex items-center gap-3">
        <Button href={`/login?redirect=/marketplace/vendors/${v.public_handle}/inquire`}>Request Quote</Button>
        <Button href="/signup" variant="ghost">
          Need an account?
        </Button>
      </div>
    </main>
  );
}
