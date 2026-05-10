import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { STATUS_TONE } from "@/lib/marketplace";
import { formatMoney } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Sub = {
  id: string;
  status: string;
  cover_note: string | null;
  fee_proposed_cents: number | null;
  submitted_at: string;
  talent_profile_id: string | null;
  open_call_id: string;
};

export default async function Page({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("open_call_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("submitter_user_id", session.userId)
    .maybeSingle();
  if (!data) return notFound();
  const s = data as Sub;

  return (
    <div>
      <div className="text-label text-[var(--color-text-tertiary)]">Submission</div>
      <div className="mt-1 flex items-center gap-2">
        <h1 className="text-display text-3xl">#{s.id.slice(0, 8)}</h1>
        <Badge variant={STATUS_TONE[s.status] ?? "muted"}>{s.status}</Badge>
      </div>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Submitted {new Date(s.submitted_at).toLocaleString()}
      </p>

      <div className="mt-6 space-y-4">
        <div className="card-elevated p-4">
          <div className="text-label text-[var(--color-text-tertiary)]">Cover note</div>
          <div className="mt-1 text-sm whitespace-pre-wrap">{s.cover_note ?? "—"}</div>
        </div>
        {s.fee_proposed_cents && (
          <div className="card-elevated p-4">
            <div className="text-label text-[var(--color-text-tertiary)]">Proposed fee</div>
            <div className="mt-1 font-mono text-sm">{formatMoney(s.fee_proposed_cents)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
