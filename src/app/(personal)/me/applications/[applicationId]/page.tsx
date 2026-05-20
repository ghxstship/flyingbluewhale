import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { STATUS_TONE } from "@/lib/marketplace";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type App = {
  id: string;
  status: string;
  applied_at: string;
  cover_note: string | null;
  resume_url: string | null;
  reel_url: string | null;
  day_rate_proposed_cents: number | null;
  job_posting_id: string;
};

export default async function Page({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", applicationId)
    .eq("applicant_user_id", session.userId)
    .maybeSingle();
  if (!data) return notFound();
  const a = data as App;

  return (
    <div>
      <div className="text-label text-[var(--color-text-tertiary)]">Application</div>
      <div className="mt-1 flex items-center gap-2">
        <h1 className="text-display text-3xl">{a.id.slice(0, 8)}</h1>
        <Badge variant={STATUS_TONE[a.status] ?? "muted"}>{a.status}</Badge>
      </div>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Applied {fmtIntl.dateTime(a.applied_at)}
      </p>

      <div className="mt-6 space-y-4">
        <div className="card-elevated p-4">
          <div className="text-label text-[var(--color-text-tertiary)]">Cover note</div>
          <div className="mt-1 text-sm whitespace-pre-wrap">{a.cover_note ?? "—"}</div>
        </div>
        {a.day_rate_proposed_cents && (
          <div className="card-elevated p-4">
            <div className="text-label text-[var(--color-text-tertiary)]">Proposed day rate</div>
            <div className="mt-1 font-mono text-sm">${(a.day_rate_proposed_cents / 100).toFixed(0)}/day</div>
          </div>
        )}
        {a.resume_url && (
          <div className="card-elevated p-4">
            <div className="text-label text-[var(--color-text-tertiary)]">Resume</div>
            <a
              className="mt-1 block text-sm text-[var(--brand-color)]"
              href={a.resume_url}
              target="_blank"
              rel="noopener"
            >
              {a.resume_url}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
