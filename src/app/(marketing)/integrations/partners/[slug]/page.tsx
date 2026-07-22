import { notFound } from "next/navigation";
import type { Metadata } from "next";
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

type Row = {
  slug: string;
  name: string;
  partner_org_name: string;
  partner_contact_email: string | null;
  short_description: string;
  long_description: string | null;
  category: string;
  capabilities: string[];
  certification_tier: "verified" | "certified";
  homepage_url: string | null;
  docs_url: string | null;
  logo_url: string | null;
  published_at: string;
};

async function getPartner(slug: string): Promise<Row | null> {
  if (!hasSupabase) return null;
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data } = await supabase
    .from("partner_integrations")
    .select(
      "slug, name, partner_org_name, partner_contact_email, short_description, long_description, category, capabilities, certification_tier, homepage_url, docs_url, logo_url, published_at",
    )
    .eq("slug", slug)
    .in("certification_tier", ["verified", "certified"])
    .not("published_at", "is", null)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as unknown as Row | null) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPartner(slug);
  const { t } = await getRequestT();
  if (!p)
    return buildMetadata({
      title: t("marketing.integrations.partnerDetail.fallbackTitle", undefined, "Partner Integration"),
      description: "",
      path: `/integrations/partners/${slug}`,
    });
  return buildMetadata({
    title: t("marketing.integrations.partnerDetail.meta.title", { name: p.name }, "{name} — ATLVS Partner Integration"),
    description: p.short_description,
    path: `/integrations/partners/${p.slug}`,
    ogImageEyebrow:
      p.certification_tier === "certified"
        ? t("marketing.integrations.partnerDetail.ogCertified", undefined, "Certified Partner")
        : t("marketing.integrations.partnerDetail.ogVerified", undefined, "Verified Partner"),
    ogImageTitle: p.name,
  });
}

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPartner(slug);
  if (!p) notFound();
  const { t } = await getRequestT();

  const crumbs = [
    { label: t("common.home", undefined, "Home"), href: "/" },
    { label: t("marketing.integrations.crumbsLabel", undefined, "Integrations"), href: "/integrations" },
    {
      label: t("marketing.integrations.partners.crumbsLabel", undefined, "Partner Directory"),
      href: "/integrations/partners",
    },
    { label: p.name, href: `/integrations/partners/${p.slug}` },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-4xl px-6 pt-8 pb-8">
        <div className="flex items-center justify-between">
          <div className="eyebrow eyebrow-brand">
            {t("marketing.integrations.partnerDetail.eyebrow", undefined, "Partner Integration")}
          </div>
          <Badge variant={p.certification_tier === "certified" ? "success" : "info"}>
            {p.certification_tier === "certified"
              ? t("marketing.integrations.partners.tier.certified", undefined, "Certified")
              : t("marketing.integrations.partners.tier.verified", undefined, "Verified")}
          </Badge>
        </div>
        <h1 className="hed-3xl mt-4">{p.name}</h1>
        <p className="mt-2 text-xs text-[var(--p-text-2)]">
          {t("marketing.integrations.partners.by", { name: p.partner_org_name }, "by {name}")}
        </p>
        <p className="mt-5 text-lg text-[var(--p-text-2)]">{p.short_description}</p>
        {p.long_description ? <p className="mt-3 text-sm">{p.long_description}</p> : null}

        {p.capabilities.length > 0 ? (
          <div className="surface mt-6 p-5">
            <div className="eyebrow">
              {t("marketing.integrations.partnerDetail.capabilities", undefined, "Capabilities")}
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {p.capabilities.map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--p-accent)]" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {p.homepage_url ? (
            <Button href={p.homepage_url} variant="primary">
              {t("marketing.integrations.partnerDetail.partnerSite", undefined, "Partner site")}
            </Button>
          ) : null}
          {p.docs_url ? (
            <Button href={p.docs_url} variant="ghost">
              {t("marketing.integrations.partnerDetail.docs", undefined, "Integration docs")}
            </Button>
          ) : null}
          <Button href="/integrations/partners" variant="ghost">
            {t("marketing.integrations.partnerDetail.backToDirectory", undefined, "Back to directory")}
          </Button>
        </div>
      </section>

      <CTASection
        title={t("marketing.integrations.partnerDetail.cta.title", undefined, "Want To Build One?")}
        subtitle={t(
          "marketing.integrations.partnerDetail.cta.subtitle",
          undefined,
          "Open API surface. No revenue share, no gatekeeping. Apply through /integrations/submit.",
        )}
      />
    </div>
  );
}
