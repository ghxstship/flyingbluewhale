import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange, STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { PublishControls } from "./PublishControls";

export const dynamic = "force-dynamic";

type Posting = {
  id: string;
  title: string;
  public_slug: string;
  description: string | null;
  job_posting_phase: string;
  posting_type: string;
  employment_type: string;
  city: string | null;
  region: string | null;
  country: string | null;
  role_taxonomy: string[];
  certs_required: string[];
  union_required: string[];
  day_rate_min_cents: number | null;
  day_rate_max_cents: number | null;
  currency: string;
  applicant_count: number;
  travel_paid: boolean;
  lodging_provided: boolean;
  vetted_only: boolean;
  published_at: string | null;
  expires_at: string | null;
};

export default async function Page({ params }: { params: Promise<{ postingId: string }> }) {
  const { postingId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_postings")
    .select("*")
    .eq("id", postingId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const p = data as Posting;
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.postings.detail.eyebrow", undefined, "Marketplace · Job Posting")}
        title={p.title}
        subtitle={[p.posting_type, p.employment_type, [p.city, p.region].filter(Boolean).join(", ") || null]
          .filter(Boolean)
          .join(" · ")}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[p.job_posting_phase] ?? "muted"}>{toTitle(p.job_posting_phase)}</Badge>
            <Button href={`/studio/marketplace/postings/${p.id}/applicants`} size="sm" variant="ghost">
              {t(
                "console.marketplace.postings.detail.applicants",
                { count: p.applicant_count },
                `${p.applicant_count} applicants`,
              )}
            </Button>
            <Button href={`/studio/marketplace/postings/${p.id}/edit`} size="sm" variant="ghost">
              {t("common.edit", undefined, "Edit")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <PublishControls
          postingId={p.id}
          status={p.job_posting_phase}
          publicSlug={p.public_slug}
          expiresAt={p.expires_at}
        />

        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.postings.detail.description", undefined, "Description")}
          </h2>
          <div className="text-sm whitespace-pre-wrap text-[var(--p-text-1)]">{p.description ?? "—"}</div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Card title={t("console.marketplace.postings.detail.roles", undefined, "Roles")} items={p.role_taxonomy} />
          <Card
            title={t("console.marketplace.postings.detail.certifications", undefined, "Certifications")}
            items={p.certs_required}
          />
          <Card title={t("console.marketplace.postings.detail.unions", undefined, "Unions")} items={p.union_required} />
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.postings.detail.compensation", undefined, "Compensation")}
            </h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.postings.detail.dayRate", undefined, "Day rate")}
              </dt>
              <dd>{formatFeeRange(p.day_rate_min_cents, p.day_rate_max_cents, p.currency)}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.postings.detail.travelPaid", undefined, "Travel paid")}
              </dt>
              <dd>{p.travel_paid ? t("common.yes", undefined, "Yes") : t("common.no", undefined, "No")}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.postings.detail.lodging", undefined, "Lodging")}
              </dt>
              <dd>
                {p.lodging_provided
                  ? t("console.marketplace.postings.detail.lodgingProvided", undefined, "Provided")
                  : t("console.marketplace.postings.detail.lodgingNotProvided", undefined, "Not provided")}
              </dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.postings.detail.audience", undefined, "Audience")}
              </dt>
              <dd>
                {p.vetted_only
                  ? t("console.marketplace.postings.detail.audienceVetted", undefined, "Vetted-only")
                  : t("console.marketplace.postings.detail.audiencePublic", undefined, "Public")}
              </dd>
            </dl>
          </div>
        </section>
      </div>
    </>
  );
}

function Card({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="surface p-5">
      <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--p-text-2)]">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((it) => (
            <Badge key={it} variant="muted">
              {it}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
