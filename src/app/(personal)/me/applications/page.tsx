import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type AppRow = {
  id: string;
  job_application_state: string;
  applied_at: string;
  cover_note: string | null;
  job_posting_id: string;
  posting: { title: string; public_slug: string; org_id: string } | null;
};

export default async function Page({ searchParams }: { searchParams: Promise<{ applied?: string }> }) {
  const { t } = await getRequestT();
  const { applied } = await searchParams;
  if (!hasSupabase) {
    return (
      <div>
        <h1 className="text-display text-3xl">{t("me.applications.title", undefined, "My Applications")}</h1>
        <p className="mt-2 text-sm">{t("me.applications.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_applications")
    .select(
      "id, job_application_state, applied_at, cover_note, job_posting_id, posting:job_posting_id(title, public_slug, org_id)",
    )
    .eq("applicant_user_id", session.userId)
    .order("applied_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as AppRow[];

  return (
    <div>
      <div className="text-label text-[var(--color-text-tertiary)]">
        {t("me.applications.eyebrow", undefined, "My applications")}
      </div>
      <h1 className="text-display mt-1 text-3xl">{t("me.applications.heading", undefined, "Applications")}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        {t(
          "me.applications.intro",
          undefined,
          "Job applications you've submitted. Stage updates land here when an operator moves you through their ATS.",
        )}
      </p>

      {applied === "1" && (
        <div className="mt-4">
          <Alert kind="success">
            {t(
              "me.applications.appliedBanner",
              undefined,
              "Application submitted. The operator sees it in their ATS now.",
            )}
          </Alert>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t("me.applications.empty.title", undefined, "No Applications Yet")}
            description={t(
              "me.applications.empty.description",
              undefined,
              "Browse open gigs and apply to start building your application history.",
            )}
            action={
              <Button href="/marketplace/gigs">{t("me.applications.empty.action", undefined, "Browse Gigs")}</Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="card-elevated flex items-center justify-between p-4">
              <div>
                <Link href={`/me/applications/${r.id}`} className="text-sm font-semibold">
                  {r.posting?.title ?? t("me.applications.deletedPosting", undefined, "Deleted Posting")}
                </Link>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {t(
                    "me.applications.appliedOn",
                    { date: new Date(r.applied_at).toLocaleDateString() },
                    `Applied ${new Date(r.applied_at).toLocaleDateString()}`,
                  )}
                </p>
              </div>
              <Badge variant={STATUS_TONE[r.job_application_state] ?? "muted"}>
                {toTitle(r.job_application_state)}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
