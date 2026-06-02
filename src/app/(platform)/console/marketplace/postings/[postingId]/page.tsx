import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange, STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestFormatters } from "@/lib/i18n/request";
import { PublishControls } from "./PublishControls";

export const dynamic = "force-dynamic";

type Posting = {
  id: string;
  title: string;
  public_slug: string;
  description: string | null;
  status: string;
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
  const fmt = await getRequestFormatters();

  const [{ data }, { data: orgPostings }, { data: firstApp }] = await Promise.all([
    supabase.from("job_postings").select("*").eq("id", postingId).eq("org_id", session.orgId).maybeSingle(),
    // Benchmark: all published postings in this org to compute category averages
    supabase
      .from("job_postings")
      .select("id, applicant_count, published_at, posting_type")
      .eq("org_id", session.orgId)
      .eq("status", "published")
      .not("published_at", "is", null),
    // Time-to-first-applicant for this posting
    supabase
      .from("job_applications")
      .select("created_at")
      .eq("job_posting_id", postingId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!data) return notFound();
  const p = data as Posting;

  // Lead Insights — competitive benchmarks derived from org data
  const peers = ((orgPostings ?? []) as { id: string; applicant_count: number; published_at: string; posting_type: string }[]).filter(
    (r) => r.id !== p.id && r.posting_type === p.posting_type,
  );
  const avgApplicants =
    peers.length > 0 ? Math.round(peers.reduce((s, r) => s + (r.applicant_count ?? 0), 0) / peers.length) : null;
  const pctileVsCategory =
    avgApplicants !== null && avgApplicants > 0
      ? Math.round((p.applicant_count / avgApplicants) * 100)
      : null;

  let hoursToFirstApp: number | null = null;
  if (firstApp && p.published_at) {
    const diffMs = new Date(firstApp.created_at).getTime() - new Date(p.published_at).getTime();
    hoursToFirstApp = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Marketplace · Job Posting"
        title={p.title}
        subtitle={[p.posting_type, p.employment_type, [p.city, p.region].filter(Boolean).join(", ") || null]
          .filter(Boolean)
          .join(" · ")}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[p.status] ?? "muted"}>{toTitle(p.status)}</Badge>
            <Button href={`/console/marketplace/postings/${p.id}/applicants`} size="sm" variant="ghost">
              {p.applicant_count} applicants
            </Button>
            <Button href={`/console/marketplace/postings/${p.id}/edit`} size="sm" variant="ghost">
              Edit
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <PublishControls postingId={p.id} status={p.status} publicSlug={p.public_slug} expiresAt={p.expires_at} />

        {/* Lead Insights — GigSalad-parity competitive intelligence panel */}
        <section className="surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">Lead Insights</h2>
            {peers.length > 0 && (
              <span className="text-[10px] text-[var(--text-muted)]">
                vs. {peers.length} other {p.posting_type} posting{peers.length === 1 ? "" : "s"} in your org
              </span>
            )}
          </div>
          <div className="metric-grid-3">
            <MetricCard
              label="Applicants"
              value={fmt.number(p.applicant_count)}
              accent
            />
            <MetricCard
              label="vs. Category Avg"
              value={
                pctileVsCategory !== null
                  ? `${pctileVsCategory > 100 ? "+" : ""}${pctileVsCategory - 100}%`
                  : peers.length === 0
                    ? "First posting"
                    : "—"
              }
            />
            <MetricCard
              label="Time to First Apply"
              value={
                hoursToFirstApp !== null
                  ? hoursToFirstApp < 24
                    ? `${hoursToFirstApp}h`
                    : `${Math.round(hoursToFirstApp / 24)}d`
                  : p.applicant_count === 0
                    ? "No applicants yet"
                    : "—"
              }
            />
          </div>
          {pctileVsCategory !== null && (
            <p className="text-xs text-[var(--text-secondary)]">
              {pctileVsCategory >= 100
                ? `This posting is performing above your category average — it has ${pctileVsCategory - 100}% more applicants than similar ${p.posting_type} postings.`
                : `This posting has ${100 - pctileVsCategory}% fewer applicants than your ${p.posting_type} average. Consider updating the rate, title, or description.`}
            </p>
          )}
          {p.applicant_count === 0 && p.status === "published" && (
            <p className="text-xs text-[var(--text-secondary)]">
              No applicants yet. Postings with a day-rate range and specific role tags typically convert 2–3× faster.
            </p>
          )}
        </section>

        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Description</h2>
          <div className="text-sm whitespace-pre-wrap text-[var(--text-primary)]">{p.description ?? "—"}</div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Card title="Roles" items={p.role_taxonomy} />
          <Card title="Certifications" items={p.certs_required} />
          <Card title="Unions" items={p.union_required} />
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">Compensation</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--text-secondary)]">Day rate</dt>
              <dd>{formatFeeRange(p.day_rate_min_cents, p.day_rate_max_cents, p.currency)}</dd>
              <dt className="text-[var(--text-secondary)]">Travel paid</dt>
              <dd>{p.travel_paid ? "Yes" : "No"}</dd>
              <dt className="text-[var(--text-secondary)]">Lodging</dt>
              <dd>{p.lodging_provided ? "Provided" : "Not provided"}</dd>
              <dt className="text-[var(--text-secondary)]">Audience</dt>
              <dd>{p.vetted_only ? "Vetted-only" : "Public"}</dd>
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
        <p className="text-sm text-[var(--text-secondary)]">—</p>
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
