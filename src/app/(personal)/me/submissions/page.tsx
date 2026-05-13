import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { STATUS_TONE } from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  status: string;
  submitted_at: string;
  open_call: { title: string; public_slug: string } | null;
};

export default async function Page() {
  if (!hasSupabase) return <div>Configure Supabase.</div>;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("open_call_submissions")
    .select("id, status, submitted_at, open_call:open_call_id(title, public_slug)")
    .eq("submitter_user_id", session.userId)
    .order("submitted_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <div>
      <div className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)]">My submissions</div>
      <h1 className="font-display mt-1 text-3xl">Submissions</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Open-call submissions you've made.</p>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No submissions yet"
            description="Open calls you've responded to will appear here."
            action={<Button href="/marketplace/calls">Browse open calls</Button>}
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="surface-raised flex items-center justify-between p-4">
              <div>
                <Link href={`/me/submissions/${r.id}`} className="text-sm font-semibold">
                  {r.open_call?.title ?? "(deleted call)"}
                </Link>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Submitted {new Date(r.submitted_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
