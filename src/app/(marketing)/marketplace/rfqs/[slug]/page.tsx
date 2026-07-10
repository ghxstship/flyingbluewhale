import { cache } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { notFound } from "next/navigation";
import { buildMetadata, metaDescription } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Rfq = {
  id: string;
  public_slug: string;
  title: string;
  description: string | null;
  trade_categories: string[];
  region: string | null;
  budget_band: string | null;
  due_at: string | null;
  requires_prequalification: boolean;
  requires_insurance: boolean;
  requires_w9: boolean;
  nda_required: boolean;
  org_name: string;
  org_slug: string;
};

// React cache() memoizes per request, so generateMetadata and the page body
// share a single Supabase round-trip.
const getRfq = cache(async (slug: string): Promise<Rfq | null> => {
  if (!hasSupabase) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_rfq_marketplace")
    // Explicit render-contract columns (HP-13): the local Row type is the
    // page's exact contract — a future column added to the public view must
    // be opted into here rather than flowing to anonymous visitors silently.
    .select(
      "id, public_slug, title, description, trade_categories, region, budget_band, due_at, requires_prequalification, requires_insurance, requires_w9, nda_required, org_name, org_slug",
    )
    .eq("public_slug", slug)
    .maybeSingle();
  return (data as Rfq | null) ?? null;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRfq(slug);
  if (!r) {
    return buildMetadata({
      title: "Open RFQs on the ATLVS Marketplace",
      description: "Browse open requests for quote from production teams on the ATLVS marketplace and submit a bid.",
      path: `/marketplace/rfqs/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${r.title} — Open RFQ on ATLVS`,
    description: metaDescription(
      r.description,
      `${r.org_name} is sourcing vendors for ${r.title} through the ATLVS marketplace. Review the scope and submit a bid.`,
    ),
    path: `/marketplace/rfqs/${r.public_slug}`,
    ogImageEyebrow: "ATLVS Marketplace · Open RFQ",
    ogImageTitle: r.title,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getRfq(slug);
  if (!r) return notFound();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("marketing.pages.marketplace.rfqs.detail.breadcrumbs.marketplace"), href: "/marketplace" },
          { label: t("marketing.pages.marketplace.rfqs.detail.breadcrumbs.openRfqs"), href: "/marketplace/rfqs" },
          { label: r.title },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {t("marketing.pages.marketplace.rfqs.detail.header.eyebrow", { org: r.org_name })}
        </div>
        <h1 className="hed-2xl mt-4">{r.title}</h1>
        <div className="mt-5 flex flex-wrap gap-2 text-sm text-[var(--p-text-2)]">
          {r.region && <Badge variant="muted">{r.region}</Badge>}
          {r.budget_band && <Badge variant="muted">{r.budget_band}</Badge>}
          {r.due_at && (
            <Badge variant="warning">
              {t("marketing.pages.marketplace.rfqs.detail.header.dueBadge", {
                date: fmt.date(new Date(r.due_at)),
              })}
            </Badge>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 pb-16">
        <div className="surface p-5">
          <h2 className="hed-md mb-3">{t("marketing.pages.marketplace.rfqs.detail.scope.title")}</h2>
          <div className="text-sm whitespace-pre-wrap">{r.description ?? "—"}</div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{t("marketing.pages.marketplace.rfqs.detail.trades.title")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {r.trade_categories.length === 0 ? (
                <span className="text-sm text-[var(--p-text-2)]">—</span>
              ) : (
                r.trade_categories.map((tag) => (
                  <Badge key={tag} variant="muted">
                    {tag}
                  </Badge>
                ))
              )}
            </div>
          </div>
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{t("marketing.pages.marketplace.rfqs.detail.compliance.title")}</h2>
            <ul className="space-y-1 text-sm">
              <li>
                {r.requires_prequalification ? "✓" : "—"}{" "}
                {t("marketing.pages.marketplace.rfqs.detail.compliance.prequalification")}
              </li>
              <li>
                {r.requires_insurance ? "✓" : "—"} {t("marketing.pages.marketplace.rfqs.detail.compliance.insurance")}
              </li>
              <li>
                {r.requires_w9 ? "✓" : "—"} {t("marketing.pages.marketplace.rfqs.detail.compliance.w9")}
              </li>
              <li>
                {r.nda_required ? "✓" : "—"} {t("marketing.pages.marketplace.rfqs.detail.compliance.nda")}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button href={`/marketplace/rfqs/${r.public_slug}/inquire`}>
            {t("marketing.pages.marketplace.rfqs.detail.cta.expressInterest", undefined, "Express Interest")}
          </Button>
          <Button href="/signup" variant="ghost">
            {t("marketing.pages.marketplace.rfqs.detail.cta.signup")}
          </Button>
        </div>
      </section>
    </>
  );
}
