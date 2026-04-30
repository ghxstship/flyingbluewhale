import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type ReportRow = {
  id: string;
  status: string;
  narrative: string;
  subject_ref: string | null;
  created_at: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  received: "muted",
  triage: "info",
  under_review: "warning",
  referred: "warning",
  closed: "success",
  rejected: "error",
};

export default async function SafeguardingPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("safeguarding_reports")
    .select("id, status, narrative, subject_ref, created_at")
    .eq("org_id", session.orgId)
    .eq("reporter_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(20);
  const reports = (data ?? []) as ReportRow[];

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--color-error)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">Safeguarding</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        File a confidential disclosure. Reports route to the designated safeguarding lead and are retained for 10 years
        per statute.
      </p>

      <div className="mt-5">
        <Link href="/console/safety/safeguarding/new" className="btn btn-danger w-full">
          File new report
        </Link>
        <p className="mt-2 text-[10px] text-[var(--text-muted)]">
          The form is currently desktop-only. Mobile-native intake is on the roadmap.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          Reports you've filed
        </h2>
        <ul className="mt-3 space-y-2">
          {reports.length === 0 ? (
            <li>
              <EmptyState
                size="compact"
                title="No reports filed"
                description="Reports filed under your account appear here. Other reporters' reports are confidential."
              />
            </li>
          ) : (
            reports.map((r) => (
              <li key={r.id} className="surface-raised p-4">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace(/_/g, " ")}</Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-[var(--text-secondary)]">{r.narrative}</p>
                {r.subject_ref && (
                  <div className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">Subject: {r.subject_ref}</div>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
