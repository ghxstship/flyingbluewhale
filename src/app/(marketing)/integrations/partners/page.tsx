import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { createServiceClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const metadata: Metadata = buildMetadata({
  title: "Partner Integrations — ATLVS Certified + Verified Partner Directory",
  description:
    "Third-party integrations built by ATLVS partners. Verified Partner integrations pass our technical review; Certified integrations also pass end-to-end QA.",
  path: "/integrations/partners",
  keywords: [
    "ATLVS partners",
    "ATLVS certified partners",
    "construction PM integrations marketplace",
    "Procore alternative integrations",
  ],
  ogImageEyebrow: "Partner Program",
  ogImageTitle: "Built By Partners. Verified By Us.",
});

type Row = {
  slug: string;
  name: string;
  partner_org_name: string;
  short_description: string;
  category: string;
  certification_tier: "verified" | "certified";
  homepage_url: string | null;
  logo_url: string | null;
  published_at: string;
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Integrations", href: "/integrations" },
    { label: "Partner Directory", href: "/integrations/partners" },
  ];

  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = createServiceClient() as unknown as LooseSupabase;
    const { data } = await supabase
      .from("partner_integrations")
      .select(
        "slug, name, partner_org_name, short_description, category, certification_tier, homepage_url, logo_url, published_at",
      )
      .in("certification_tier", ["verified", "certified"])
      .not("published_at", "is", null)
      .is("deleted_at", null)
      .order("certification_tier", { ascending: false })
      .order("published_at", { ascending: false });
    rows = (data ?? []) as unknown as Row[];
  }

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-8">
        <div className="eyebrow eyebrow-brand">Partner Program</div>
        <h1 className="hed-3xl mt-4">Built By Partners. Verified By Us.</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">
          Third-party integrations that hit the ATLVS REST + GraphQL surface. Verified Partner integrations pass our
          technical review; Certified integrations also pass end-to-end QA on a live tenant. Build your own —{" "}
          <Link href="/integrations/submit" className="underline">
            submit a proposal
          </Link>
          .
        </p>
        <div className="mt-6 flex gap-3">
          <Button href="/integrations/submit">Submit a partner integration</Button>
          <Button href="/integrations" variant="ghost">
            Back to live integrations
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        {rows.length === 0 ? (
          <div className="surface p-8 text-center text-sm text-[var(--text-secondary)]">
            No partner integrations are listed publicly yet.{" "}
            <Link href="/integrations/submit" className="underline">
              Be the first.
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {rows.map((r) => (
              <Link key={r.slug} href={`/integrations/partners/${r.slug}`} className="surface hover-lift p-5">
                <div className="flex items-start justify-between">
                  <div className="text-sm font-semibold">{r.name}</div>
                  <Badge variant={r.certification_tier === "certified" ? "success" : "info"}>
                    {r.certification_tier === "certified" ? "Certified" : "Verified"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">{r.short_description}</p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">by {r.partner_org_name}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--org-primary)]">
                    Details <ArrowRight size={11} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <CTASection
        title="Bring Your Stack Inside."
        subtitle="Open API + open partner program. No revenue share, no gatekeeping."
      />
    </div>
  );
}
