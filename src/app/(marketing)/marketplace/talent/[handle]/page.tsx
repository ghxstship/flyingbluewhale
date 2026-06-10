import { cache } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange } from "@/lib/marketplace";
import { getRequestT } from "@/lib/i18n/request";
import { buildMetadata, metaDescription } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  public_handle: string;
  act_name: string;
  tagline: string | null;
  bio: string | null;
  genre_tags: string[];
  photo_url: string | null;
  hero_url: string | null;
  video_reel_url: string | null;
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  travel_radius_km: number | null;
  monthly_listeners: number | null;
  follower_count: number | null;
  rating_avg: number | null;
  rating_count: number;
  is_verified: boolean;
};

// React cache() memoizes per request, so generateMetadata and the page body
// share a single Supabase round-trip (supabase calls don't get the fetch()
// request-dedupe for free).
const getTalent = cache(async (handle: string): Promise<Row | null> => {
  if (!hasSupabase) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("public_talent_directory").select("*").eq("public_handle", handle).maybeSingle();
  return (data as Row | null) ?? null;
});

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const t = await getTalent(handle);
  if (!t) {
    return buildMetadata({
      title: "Talent on the ATLVS Marketplace",
      description:
        "Browse artist EPKs, fee bands, and riders on the ATLVS marketplace — bookable talent, verified by operators.",
      path: `/marketplace/talent/${handle}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${t.act_name} — Talent on ATLVS`,
    description: metaDescription(
      t.tagline ?? t.bio,
      `Book ${t.act_name} through the ATLVS marketplace — EPK, fee band, and booking inquiry in one place.`,
    ),
    path: `/marketplace/talent/${t.public_handle}`,
    ogImageEyebrow: "ATLVS Marketplace",
    ogImageTitle: t.act_name,
  });
}

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const t = await getTalent(handle);
  if (!t) return notFound();
  const { t: tr } = await getRequestT();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: tr("marketing.pages.marketplace.talent.detail.breadcrumb.marketplace"), href: "/marketplace" },
          { label: tr("marketing.pages.marketplace.talent.detail.breadcrumb.talent"), href: "/marketplace/talent" },
          { label: t.act_name },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">@{t.public_handle}</div>
        <div className="mt-4 flex items-start gap-3">
          <h1 className="hed-2xl">{t.act_name}</h1>
          {t.is_verified && (
            <Badge variant="success">{tr("marketing.pages.marketplace.talent.detail.verifiedBadge")}</Badge>
          )}
        </div>
        {t.tagline && <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">{t.tagline}</p>}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {t.genre_tags.map((g) => (
            <Badge key={g} variant="muted">
              {g}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 pb-16">
        {t.bio && (
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{tr("marketing.pages.marketplace.talent.detail.bio.heading")}</h2>
            <div className="text-sm whitespace-pre-wrap">{t.bio}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{tr("marketing.pages.marketplace.talent.detail.booking.heading")}</h2>
            <dl className="space-y-1 text-sm">
              <div>
                <span className="text-[var(--p-text-2)]">
                  {tr("marketing.pages.marketplace.talent.detail.booking.feeBandLabel")}
                </span>{" "}
                {formatFeeRange(t.fee_min_cents, t.fee_max_cents, t.currency)}
              </div>
              <div>
                <span className="text-[var(--p-text-2)]">
                  {tr("marketing.pages.marketplace.talent.detail.booking.travelRadiusLabel")}
                </span>{" "}
                {t.travel_radius_km ? `${t.travel_radius_km} km` : "—"}
              </div>
              <div>
                <span className="text-[var(--p-text-2)]">
                  {tr("marketing.pages.marketplace.talent.detail.booking.ratingLabel")}
                </span>{" "}
                {t.rating_avg == null
                  ? tr("marketing.pages.marketplace.talent.detail.booking.noReviews")
                  : `★ ${t.rating_avg} (${t.rating_count})`}
              </div>
            </dl>
          </div>
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{tr("marketing.pages.marketplace.talent.detail.reach.heading")}</h2>
            <dl className="space-y-1 text-sm">
              <div>
                <span className="text-[var(--p-text-2)]">
                  {tr("marketing.pages.marketplace.talent.detail.reach.monthlyListenersLabel")}
                </span>{" "}
                {t.monthly_listeners?.toLocaleString() ?? "—"}
              </div>
              <div>
                <span className="text-[var(--p-text-2)]">
                  {tr("marketing.pages.marketplace.talent.detail.reach.followersLabel")}
                </span>{" "}
                {t.follower_count?.toLocaleString() ?? "—"}
              </div>
              <div>
                <span className="text-[var(--p-text-2)]">
                  {tr("marketing.pages.marketplace.talent.detail.reach.reelLabel")}
                </span>{" "}
                {t.video_reel_url ? (
                  <a
                    href={t.video_reel_url}
                    target="_blank"
                    rel="noopener"
                    className="font-mono text-[var(--p-accent)]"
                  >
                    {tr("marketing.pages.marketplace.talent.detail.reach.watchCta")}
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </dl>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button href={`/marketplace/talent/${t.public_handle}/inquire`}>
            {tr("marketing.pages.marketplace.talent.detail.cta.sendInquiry")}
          </Button>
          <Button href="/signup" variant="ghost">
            {tr("marketing.pages.marketplace.talent.detail.cta.needAccount")}
          </Button>
        </div>
      </section>
    </>
  );
}
