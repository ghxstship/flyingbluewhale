import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type RfqRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_at: string | null;
  project: { name: string | null } | null;
  awarded_vendor: { name: string | null } | null;
  created_at: string;
  updated_at: string;
};

type ResponseRow = {
  id: string;
  response_state: string;
  total_cents: number | null;
  notes: string | null;
  submitted_at: string | null;
  awarded_at: string | null;
  vendor: { name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted",
  open: "info",
  closed: "warning",
  awarded: "success",
  cancelled: "error",
};

const RESPONSE_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  invited: "muted",
  viewed: "info",
  responded: "info",
  no_bid: "muted",
  withdrawn: "warning",
  awarded: "success",
  declined: "error",
};

export default async function Page({ params }: { params: Promise<{ rfqId: string }> }) {
  const { rfqId } = await params;
  const formatters = await getRequestFormatters();
  const fmtIntl = formatters;
  const fmt = (iso: string | null): string => (iso ? formatters.dateTime(iso) : "—");
  const fmtMoney = (cents: number | null): string => formatters.money(cents);
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Procurement" title="RFQ" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("rfqs")
    .select(
      "id, title, description, status, due_at, created_at, updated_at, " +
        "project:project_id(name), awarded_vendor:awarded_to_vendor_id(name)",
    )
    .eq("id", rfqId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const rfq = data as unknown as RfqRow | null;
  if (!rfq) notFound();

  const { data: respData } = await supabase
    .from("rfq_responses")
    .select("id, response_state, total_cents, notes, submitted_at, awarded_at, vendor:vendor_id(name)")
    .eq("org_id", session.orgId)
    .order("submitted_at", { ascending: false })
    .limit(50);

  const responses = (respData ?? []) as unknown as ResponseRow[];
  const responded = responses.filter((r) => r.response_state === "responded" || r.response_state === "awarded").length;
  const lowestBid = responses
    .filter((r) => r.total_cents != null)
    .sort((a, b) => (a.total_cents ?? 0) - (b.total_cents ?? 0))[0];

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        title={rfq.title}
        subtitle={
          <span className="font-mono text-xs">
            {rfq.project?.name ?? "—"} · due {fmt(rfq.due_at)}
          </span>
        }
        breadcrumbs={[
          { label: "Procurement", href: "/console/procurement" },
          { label: "RFQs", href: "/console/procurement/rfqs" },
          { label: rfq.title },
        ]}
        action={<Badge variant={STATUS_TONE[rfq.status] ?? "muted"}>{toTitle(rfq.status)}</Badge>}
      />
      <div className="page-content space-y-5">
        {rfq.description && <p className="text-sm text-[var(--text-secondary)]">{rfq.description}</p>}

        <div className="metric-grid-3">
          <MetricCard label="Responses" value={fmtIntl.number(responses.length)} />
          <MetricCard label="Submitted" value={fmtIntl.number(responded)} />
          <MetricCard
            label="Awarded Vendor"
            value={rfq.awarded_vendor?.name ?? "—"}
            accent={Boolean(rfq.awarded_vendor?.name)}
          />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Bid Summary</h3>
          {responses.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No responses yet. Invite vendors via the requisitions table to start collecting bids.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {lowestBid && (
                <div className="rounded bg-[var(--bg-secondary)] p-3 text-xs">
                  <div className="text-[var(--text-muted)]">Lowest bid</div>
                  <div className="mt-1 font-mono text-sm">
                    {lowestBid.vendor?.name ?? "—"} · {fmtMoney(lowestBid.total_cents)}
                  </div>
                </div>
              )}
              <ul className="divide-y divide-[var(--border-color)]">
                {responses.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium">{r.vendor?.name ?? "—"}</div>
                      <div className="font-mono text-[10px] text-[var(--text-muted)]">
                        {r.submitted_at ? fmt(r.submitted_at) : "Pending"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs">{fmtMoney(r.total_cents)}</span>
                      <Badge variant={RESPONSE_TONE[r.response_state] ?? "muted"}>{toTitle(r.response_state)}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Linked Requisitions</h3>
            <Link
              href={`/console/procurement/requisitions?rfqId=${rfq.id}`}
              className="text-xs text-[var(--org-primary)]"
            >
              View →
            </Link>
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Award is captured on the linked requisitions; bidder line items roll up here.
          </p>
        </section>
      </div>
    </>
  );
}
