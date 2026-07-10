import { cache } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { notFound } from "next/navigation";
import { buildMetadata, metaDescription } from "@/lib/seo";

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

// React cache() memoizes per request, so generateMetadata and the page body
// share a single Supabase round-trip.
const getVendor = cache(async (handle: string): Promise<Row | null> => {
  if (!hasSupabase) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_vendor_directory")
    // Explicit render-contract columns (HP-13): the local Row type is the
    // page's exact contract — a future column added to the public view must
    // be opted into here rather than flowing to anonymous visitors silently.
    .select(
      "id, public_handle, name, tagline, bio, logo_url, hero_url, website_url, trade_categories, regions, rating_avg, rating_count, is_verified, year_founded",
    )
    .eq("public_handle", handle)
    .maybeSingle();
  return (data as Row | null) ?? null;
});

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const v = await getVendor(handle);
  if (!v) {
    return buildMetadata({
      title: "Vendors on the ATLVS Marketplace",
      description:
        "Browse production vendor profiles, trade categories, and coverage regions on the ATLVS marketplace.",
      path: `/marketplace/vendors/${handle}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${v.name} — Vendor on ATLVS`,
    description: metaDescription(
      v.tagline ?? v.bio,
      `Request a quote from ${v.name} through the ATLVS marketplace — trades, coverage regions, and reviews in one profile.`,
    ),
    path: `/marketplace/vendors/${v.public_handle}`,
    ogImageEyebrow: "ATLVS Marketplace",
    ogImageTitle: v.name,
  });
}

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const v = await getVendor(handle);
  if (!v) return notFound();
  const { t } = await getRequestT();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("marketing.pages.marketplace-vendors-detail.breadcrumbs.marketplace"), href: "/marketplace" },
          { label: t("marketing.pages.marketplace-vendors-detail.breadcrumbs.vendors"), href: "/marketplace/vendors" },
          { label: v.name },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">@{v.public_handle}</div>
        <div className="mt-4 flex items-start gap-3">
          <h1 className="hed-2xl">{v.name}</h1>
          {v.is_verified && (
            <Badge variant="success">{t("marketing.pages.marketplace-vendors-detail.badges.verified")}</Badge>
          )}
        </div>
        {v.tagline && <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">{v.tagline}</p>}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {v.trade_categories.map((t) => (
            <Badge key={t} variant="muted">
              {t}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 pb-16">
        {v.bio && (
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-vendors-detail.about.title")}</h2>
            <div className="text-sm whitespace-pre-wrap">{v.bio}</div>
          </div>
        )}

        <div className="surface p-5">
          <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-vendors-detail.coverage.title")}</h2>
          <dl className="space-y-1 text-sm">
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("marketing.pages.marketplace-vendors-detail.coverage.regions")}
              </span>{" "}
              {v.regions.join(", ") || "—"}
            </div>
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("marketing.pages.marketplace-vendors-detail.coverage.founded")}
              </span>{" "}
              {v.year_founded ?? "—"}
            </div>
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("marketing.pages.marketplace-vendors-detail.coverage.web")}
              </span>{" "}
              {v.website_url ? (
                <a href={v.website_url} target="_blank" rel="noopener" className="font-mono text-[var(--p-accent)]">
                  {v.website_url} ↗
                </a>
              ) : (
                "—"
              )}
            </div>
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("marketing.pages.marketplace-vendors-detail.coverage.rating")}
              </span>{" "}
              {v.rating_avg == null
                ? t("marketing.pages.marketplace-vendors-detail.coverage.noReviews")
                : `★ ${v.rating_avg} (${v.rating_count})`}
            </div>
          </dl>
        </div>

        <div className="flex items-center gap-3">
          <Button href={`/marketplace/vendors/${v.public_handle}/inquire`}>
            {t("marketing.pages.marketplace-vendors-detail.cta.requestQuote")}
          </Button>
          <Button href="/signup" variant="ghost">
            {t("marketing.pages.marketplace-vendors-detail.cta.needAccount")}
          </Button>
        </div>
      </section>
    </>
  );
}
