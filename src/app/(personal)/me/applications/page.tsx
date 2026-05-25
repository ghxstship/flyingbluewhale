import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type AppRow = {
  id: string;
  status: string;
  applied_at: string;
  cover_note: string | null;
  job_posting_id: string;
  posting: { title: string; public_slug: string; org_id: string } | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <div>
        <h1 className="text-display text-3xl">My Applications</h1>
        <p className="mt-2 text-sm">Configure Supabase.</p>
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_applications")
    .select("id, status, applied_at, cover_note, job_posting_id, posting:job_posting_id(title, public_slug, org_id)")
    .eq("applicant_user_id", session.userId)
    .order("applied_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as AppRow[];

  return (
    <div>
      <div className="text-label text-[var(--color-text-tertiary)]">My applications</div>
      <h1 className="text-display mt-1 text-3xl">Applications</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Job applications you've submitted. Stage updates land here when an operator moves you through their ATS.
      </p>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No Applications Yet"
            description="Browse open gigs and apply to start building your application history."
            action={<Button href="/marketplace/gigs">Browse Gigs</Button>}
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="card-elevated flex items-center justify-between p-4">
              <div>
                <Link href={`/me/applications/${r.id}`} className="text-sm font-semibold">
                  {r.posting?.title ?? "Deleted Posting"}
                </Link>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Applied {formatDate(r.applied_at)}
                </p>
              </div>
              <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
