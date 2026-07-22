import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type App = {
  id: string;
  org_id: string;
  job_application_state: string;
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
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
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
      <div className="eyebrow">
        {t("me.applications.detail.eyebrow", undefined, "Application")}
      </div>
      <div className="mt-1 flex items-center gap-2">
        <h1>{a.id.slice(0, 8)}</h1>
        <Badge variant={STATUS_TONE[a.job_application_state] ?? "muted"}>{toTitle(a.job_application_state)}</Badge>
      </div>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t(
          "me.applications.detail.appliedAt",
          { when: fmt.dateTime(new Date(a.applied_at)) },
          `Applied ${fmt.dateTime(new Date(a.applied_at))}`,
        )}
      </p>

      <div className="mt-6 space-y-4">
        <div className="surface-raised p-4">
          <div className="eyebrow">
            {t("me.applications.detail.coverNote", undefined, "Cover note")}
          </div>
          <div className="mt-1 text-sm whitespace-pre-wrap">{a.cover_note ?? "—"}</div>
        </div>
        {a.day_rate_proposed_cents && (
          <div className="surface-raised p-4">
            <div className="eyebrow">
              {t("me.applications.detail.proposedDayRate", undefined, "Proposed day rate")}
            </div>
            <div className="mt-1 font-mono text-sm">
              {t(
                "me.applications.detail.dayRateValue",
                { amount: (a.day_rate_proposed_cents / 100).toFixed(0) },
                `$${(a.day_rate_proposed_cents / 100).toFixed(0)}/day`,
              )}
            </div>
          </div>
        )}
        {a.job_application_state === "booked" && (
          <div className="surface-raised flex items-center justify-between p-4">
            <div>
              <div className="eyebrow">
                {t("me.applications.detail.review.label", undefined, "Booked and wrapped?")}
              </div>
              <div className="mt-1 text-sm text-[var(--p-text-2)]">
                {t(
                  "me.applications.detail.review.body",
                  undefined,
                  "Rate the working relationship. Reviews stay hidden until both sides post.",
                )}
              </div>
            </div>
            <Button
              href={`/me/reviews/new?transactionType=job_application&transactionId=${a.id}&subjectType=org&subjectId=${a.org_id}`}
            >
              {t("me.applications.detail.review.cta", undefined, "Write A Review")}
            </Button>
          </div>
        )}
        {a.resume_url && (
          <div className="surface-raised p-4">
            <div className="eyebrow">
              {t("me.applications.detail.resume", undefined, "Resume")}
            </div>
            <a
              className="mt-1 block text-sm text-[var(--p-accent-text)]"
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
