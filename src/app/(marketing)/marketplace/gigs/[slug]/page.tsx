import { cache } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { buildMetadata, jobPostingSchema, metaDescription } from "@/lib/seo";
import { JsonLd } from "@/components/marketing/JsonLd";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

// public_job_board.employment_type → schema.org JobPosting employmentType enum.
const EMPLOYMENT_TYPE_MAP: Record<string, "FULL_TIME" | "PART_TIME" | "CONTRACTOR" | "TEMPORARY" | "INTERN"> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACTOR",
  contractor: "CONTRACTOR",
  freelance: "CONTRACTOR",
  temporary: "TEMPORARY",
  seasonal: "TEMPORARY",
  internship: "INTERN",
  intern: "INTERN",
};

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
  published_at: string | null;
  org_name: string;
  org_slug: string;
};

// React cache() memoizes per request, so generateMetadata and the page body
// share a single Supabase round-trip.
const getGig = cache(async (slug: string): Promise<Row | null> => {
  if (!hasSupabase) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("public_job_board").select("*").eq("public_slug", slug).maybeSingle();
  return (data as Row | null) ?? null;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await getGig(slug);
  if (!r) {
    return buildMetadata({
      title: "Crew Gigs on the ATLVS Marketplace",
      description:
        "Browse open crew gigs from production teams on the ATLVS marketplace — rates, locations, and requirements up front.",
      path: `/marketplace/gigs/${slug}`,
      noIndex: true,
    });
  }
  const where = [r.city, r.region, r.country].filter(Boolean).join(", ");
  return buildMetadata({
    title: `${r.title} — Crew Gig on ATLVS`,
    description: metaDescription(
      r.description,
      `${r.org_name} is hiring for ${r.title}${where ? ` in ${where}` : ""} through the ATLVS marketplace. Review the role and apply.`,
    ),
    path: `/marketplace/gigs/${r.public_slug}`,
    ogImageEyebrow: "ATLVS Marketplace · Crew Gig",
    ogImageTitle: r.title,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getGig(slug);
  if (!r) return notFound();
  const { t } = await getRequestT();

  return (
    <>
      {r.published_at && (
        <JsonLd
          data={[
            jobPostingSchema({
              title: r.title,
              description:
                r.description ?? `${r.org_name} is hiring for ${r.title} through the ATLVS marketplace.`,
              url: urlFor("marketing", `/marketplace/gigs/${r.public_slug}`),
              datePosted: r.published_at,
              employmentType: EMPLOYMENT_TYPE_MAP[r.employment_type?.toLowerCase()] ?? "CONTRACTOR",
              location: {
                city: r.city ?? undefined,
                region: r.region ?? undefined,
                country: r.country ?? undefined,
              },
              ...(r.day_rate_min_cents != null && r.day_rate_max_cents != null
                ? {
                    baseSalary: {
                      min: r.day_rate_min_cents / 100,
                      max: r.day_rate_max_cents / 100,
                      currency: r.currency,
                      unitText: "DAY" as const,
                    },
                  }
                : {}),
            }),
          ]}
        />
      )}
      <Breadcrumbs
        items={[
          { label: t("marketing.pages.marketplace-gigs-detail.breadcrumbs.marketplace"), href: "/marketplace" },
          { label: t("marketing.pages.marketplace-gigs-detail.breadcrumbs.crewGigs"), href: "/marketplace/gigs" },
          { label: r.title },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {t("marketing.pages.marketplace-gigs-detail.hero.eyebrow")} · {r.org_name}
        </div>
        <h1 className="hed-2xl mt-4">{r.title}</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge variant="muted">{toTitle(r.posting_type)}</Badge>
          <Badge variant="muted">{r.employment_type.toUpperCase()}</Badge>
          {[r.city, r.region, r.country].filter(Boolean).length > 0 && (
            <Badge variant="muted">{[r.city, r.region, r.country].filter(Boolean).join(", ")}</Badge>
          )}
          <Badge variant="info">
            {formatFeeRange(r.day_rate_min_cents, r.day_rate_max_cents, r.currency)}
            {t("marketing.pages.marketplace-gigs-detail.hero.perDay")}
          </Badge>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 pb-16">
        <div className="surface p-5">
          <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-gigs-detail.about.title")}</h2>
          <div className="text-sm whitespace-pre-wrap">{r.description ?? "—"}</div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-gigs-detail.roles.title")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {r.role_taxonomy.length === 0 ? (
                <span className="text-sm text-[var(--p-text-2)]">—</span>
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
            <h2 className="hed-md mb-3">{t("marketing.pages.marketplace-gigs-detail.requirements.title")}</h2>
            <dl className="space-y-1 text-sm">
              <div>
                <span className="text-[var(--p-text-2)]">
                  {t("marketing.pages.marketplace-gigs-detail.requirements.unions")}
                </span>{" "}
                {r.union_required.join(", ") || "—"}
              </div>
              <div>
                <span className="text-[var(--p-text-2)]">
                  {t("marketing.pages.marketplace-gigs-detail.requirements.certs")}
                </span>{" "}
                {r.certs_required.join(", ") || "—"}
              </div>
              <div>
                <span className="text-[var(--p-text-2)]">
                  {t("marketing.pages.marketplace-gigs-detail.requirements.travel")}
                </span>{" "}
                {r.travel_paid
                  ? t("marketing.pages.marketplace-gigs-detail.requirements.travelPaid")
                  : t("marketing.pages.marketplace-gigs-detail.requirements.travelNotPaid")}
              </div>
              <div>
                <span className="text-[var(--p-text-2)]">
                  {t("marketing.pages.marketplace-gigs-detail.requirements.lodging")}
                </span>{" "}
                {r.lodging_provided
                  ? t("marketing.pages.marketplace-gigs-detail.requirements.lodgingProvided")
                  : t("marketing.pages.marketplace-gigs-detail.requirements.lodgingNotProvided")}
              </div>
            </dl>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button href={`/marketplace/gigs/${r.public_slug}/apply`}>
            {t("marketing.pages.marketplace-gigs-detail.cta.apply")}
          </Button>
          <Button href="/signup" variant="ghost">
            {t("marketing.pages.marketplace-gigs-detail.cta.needAccount")}
          </Button>
          <span className="text-xs text-[var(--p-text-2)]">
            {r.applicant_count} {t("marketing.pages.marketplace-gigs-detail.cta.applicants")}
          </span>
        </div>
      </section>
    </>
  );
}
