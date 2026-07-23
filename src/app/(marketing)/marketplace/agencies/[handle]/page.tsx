import { cache } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { getRequestT } from "@/lib/i18n/request";
import { buildMetadata, metaDescription } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  public_handle: string;
  display_name: string;
  bio: string | null;
  logo_url: string | null;
  website_url: string | null;
  default_commission_bps: number;
  is_verified: boolean;
  artist_count: number;
};

// React cache() memoizes per request, so generateMetadata and the page body
// share a single Supabase round-trip.
const getAgency = cache(async (handle: string): Promise<Row | null> => {
  if (!hasSupabase) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_agency_directory")
    // Explicit render-contract columns (HP-13): the local Row type is the
    // page's exact contract — a future column added to the public view must
    // be opted into here rather than flowing to anonymous visitors silently.
    .select(
      "id, public_handle, display_name, bio, logo_url, website_url, default_commission_bps, is_verified, artist_count",
    )
    .eq("public_handle", handle)
    .maybeSingle();
  return (data as Row | null) ?? null;
});

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const a = await getAgency(handle);
  if (!a) {
    return buildMetadata({
      title: "Agencies on the ATLVS Marketplace",
      description: "Browse booking agency profiles and artist rosters on the ATLVS marketplace.",
      path: `/marketplace/agencies/${handle}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${a.display_name} · Agency on ATLVS`,
    description: metaDescription(
      a.bio,
      `Work with ${a.display_name} through the ATLVS marketplace: roster, commission terms, and booking inquiries in one profile.`,
    ),
    path: `/marketplace/agencies/${a.public_handle}`,
    ogImageEyebrow: "ATLVS Marketplace",
    ogImageTitle: a.display_name,
  });
}

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const a = await getAgency(handle);
  if (!a) return notFound();
  const { t } = await getRequestT();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t("marketing.marketplace.crumbsLabel", undefined, "Marketplace"), href: "/marketplace" },
          {
            label: t("marketing.marketplace.agencies.crumbsLabel", undefined, "Agencies"),
            href: "/marketplace/agencies",
          },
          { label: a.display_name },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">@{a.public_handle}</div>
        <div className="mt-4 flex items-start gap-3">
          <h1 className="hed-2xl">{a.display_name}</h1>
          {a.is_verified && (
            <Badge variant="success">
              {t("marketing.marketplace.agencies.detail.verified", undefined, "verified")}
            </Badge>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 pb-16">
        {a.bio && (
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{t("marketing.marketplace.agencies.detail.about", undefined, "About")}</h2>
            <div className="text-sm whitespace-pre-wrap">{a.bio}</div>
          </div>
        )}

        <div className="surface p-5">
          <h2 className="hed-md mb-3">{t("marketing.marketplace.agencies.detail.profile", undefined, "Profile")}</h2>
          <dl className="space-y-1 text-sm">
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("marketing.marketplace.agencies.detail.rosterSize", undefined, "Roster size:")}
              </span>{" "}
              {a.artist_count}
            </div>
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("marketing.marketplace.agencies.detail.defaultCommission", undefined, "Default commission:")}
              </span>{" "}
              {(a.default_commission_bps / 100).toFixed(2)}%
            </div>
            <div>
              <span className="text-[var(--p-text-2)]">
                {t("marketing.marketplace.agencies.detail.web", undefined, "Web:")}
              </span>{" "}
              {a.website_url ? (
                <a href={a.website_url} target="_blank" rel="noopener" className="font-mono text-[var(--p-accent)]">
                  {a.website_url} ↗
                </a>
              ) : (
                "—"
              )}
            </div>
          </dl>
        </div>

        <div className="flex items-center gap-3">
          <Button href={`/marketplace/agencies/${a.public_handle}/inquire`}>
            {t("marketing.marketplace.agencies.detail.sendInquiry", undefined, "Send Inquiry")}
          </Button>
          <Button href="/signup" variant="ghost">
            {t("marketing.marketplace.agencies.detail.needAccount", undefined, "Need an account?")}
          </Button>
        </div>
      </section>
    </>
  );
}
