import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata, breadcrumbSchema } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t(
      "marketing.integrations.partners.meta.title",
      undefined,
      "Partner Integrations: ATLVS Certified + Verified Partner Directory",
    ),
    description: t(
      "marketing.integrations.partners.meta.description",
      undefined,
      "Third-party integrations built by ATLVS partners. Verified Partner integrations pass our technical review; Certified integrations also pass end-to-end QA.",
    ),
    path: "/integrations/partners",
    keywords: [
      "ATLVS partners",
      "ATLVS certified partners",
      "construction PM integrations marketplace",
      "Procore alternative integrations",
    ],
    ogImageEyebrow: t("marketing.integrations.eyebrow", undefined, "Partner Program"),
    ogImageTitle: t("marketing.integrations.partners.title", undefined, "Built By Partners. Verified By Us."),
  });
}

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
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("common.home", undefined, "Home"), href: "/" },
    { label: t("marketing.integrations.crumbsLabel", undefined, "Integrations"), href: "/integrations" },
    {
      label: t("marketing.integrations.partners.crumbsLabel", undefined, "Partner Directory"),
      href: "/integrations/partners",
    },
  ];

  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = (await createClient()) as unknown as LooseSupabase;
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
        <div className="eyebrow eyebrow-brand">{t("marketing.integrations.eyebrow", undefined, "Partner Program")}</div>
        <h1 className="hed-3xl mt-4">
          {t("marketing.integrations.partners.title", undefined, "Built By Partners. Verified By Us.")}
        </h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">
          {t(
            "marketing.integrations.partners.lead",
            undefined,
            "Third-party integrations that hit the ATLVS REST + GraphQL surface. Verified Partner integrations clear our technical review; Certified integrations also clear end-to-end QA on a live tenant. Build your own:",
          )}{" "}
          <Link href="/integrations/submit" className="underline">
            {t("marketing.integrations.partners.submitLink", undefined, "submit a proposal")}
          </Link>
          .
        </p>
        <div className="mt-6 flex gap-3">
          <Button href="/integrations/submit">
            {t("marketing.integrations.partners.cta.submit", undefined, "Submit a partner integration")}
          </Button>
          <Button href="/integrations" variant="ghost">
            {t("marketing.integrations.partners.cta.back", undefined, "Back to live integrations")}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        {rows.length === 0 ? (
          <div className="surface p-8 text-center text-sm text-[var(--p-text-2)]">
            {t(
              "marketing.integrations.partners.emptyBefore",
              undefined,
              "No partner integrations are listed publicly yet.",
            )}{" "}
            <Link href="/integrations/submit" className="underline">
              {t("marketing.integrations.partners.emptyLink", undefined, "Be the first.")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {rows.map((r) => (
              <Link key={r.slug} href={`/integrations/partners/${r.slug}`} className="surface hover-lift p-5">
                <div className="flex items-start justify-between">
                  <div className="text-sm font-semibold">{r.name}</div>
                  <Badge variant={r.certification_tier === "certified" ? "success" : "info"}>
                    {r.certification_tier === "certified"
                      ? t("marketing.integrations.partners.tier.certified", undefined, "Certified")
                      : t("marketing.integrations.partners.tier.verified", undefined, "Verified")}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-[var(--p-text-2)]">{r.short_description}</p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-[var(--p-text-2)]">
                    {t("marketing.integrations.partners.by", { name: r.partner_org_name }, "by {name}")}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--p-accent)]">
                    {t("marketing.integrations.partners.details", undefined, "Details")} <ArrowRight size={11} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <CTASection
        title={t("marketing.integrations.partners.cta.bringTitle", undefined, "Bring Your Stack Inside.")}
        subtitle={t(
          "marketing.integrations.partners.cta.bringSubtitle",
          undefined,
          "Open API + open partner program. No revenue share, no gatekeeping.",
        )}
      />
    </div>
  );
}
