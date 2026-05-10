import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange, STATUS_TONE } from "@/lib/marketplace";
import { PublishControls } from "./PublishControls";

export const dynamic = "force-dynamic";

type Posting = {
  id: string;
  title: string;
  public_slug: string;
  description: string | null;
  posting_phase: string;
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
            <Badge variant={STATUS_TONE[p.posting_phase] ?? "muted"}>{p.posting_phase}</Badge>
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
        <PublishControls postingId={p.id} status={p.posting_phase} publicSlug={p.public_slug} expiresAt={p.expires_at} />

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
