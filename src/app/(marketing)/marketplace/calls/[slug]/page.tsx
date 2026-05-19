import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange } from "@/lib/marketplace";
import { formatDate, formatDateTime } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  public_slug: string;
  kind: string;
  title: string;
  description: string | null;
  genre_tags: string[];
  trade_categories: string[];
  region: string | null;
  venue_type: string | null;
  performance_date: string | null;
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  deadline_at: string | null;
  eligibility: Record<string, unknown>;
  submission_count: number;
  org_name: string;
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) return notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("public_open_calls").select("*").eq("public_slug", slug).maybeSingle();
  if (!data) return notFound();
  const c = data as Row;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Open Calls", href: "/marketplace/calls" },
          { label: c.title },
        ]}
        className="mx-auto max-w-6xl px-6 pt-6"
      />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {c.kind.replace("_", " ")} · {c.org_name}
        </div>
        <h1 className="hed-2xl mt-4">{c.title}</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          {c.region && <Badge variant="muted">{c.region}</Badge>}
          {c.venue_type && <Badge variant="muted">{c.venue_type}</Badge>}
          {c.deadline_at && <Badge variant="warning">Closes {formatDate(c.deadline_at)}</Badge>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-6 pb-16">
        <div className="surface p-5">
          <h2 className="hed-md mb-3">Brief</h2>
          <div className="text-sm whitespace-pre-wrap">{c.description ?? "—"}</div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="hed-md mb-3">Tags</h2>
            <div className="flex flex-wrap gap-1.5">
              {[...c.genre_tags, ...c.trade_categories].map((t) => (
                <Badge key={t} variant="muted">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div className="surface p-5">
            <h2 className="hed-md mb-3">Booking Window</h2>
            <dl className="space-y-1 text-sm">
              <div>
                <span className="text-[var(--text-secondary)]">Performance:</span> {c.performance_date ?? "TBD"}
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Fee:</span>{" "}
                {formatFeeRange(c.fee_min_cents, c.fee_max_cents, c.currency)}
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Deadline:</span>{" "}
                {c.deadline_at ? formatDateTime(c.deadline_at) : "—"}
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Submissions:</span> {c.submission_count}
              </div>
            </dl>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button href={`/login?redirect=/marketplace/calls/${c.public_slug}/submit`}>Submit</Button>
          <Button href="/signup" variant="ghost">
            Need an account?
          </Button>
        </div>
      </section>
    </>
  );
}
