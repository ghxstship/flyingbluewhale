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
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  submission_state: string;
  submitted_at: string;
  open_call: { title: string; public_slug: string } | null;
};

export default async function Page({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const { t } = await getRequestT();
  const { submitted } = await searchParams;
  if (!hasSupabase) return <div>{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("open_call_submissions")
    .select("id, submission_state, submitted_at, open_call:open_call_id(title, public_slug)")
    .eq("submitter_user_id", session.userId)
    .order("submitted_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <div>
      <div className="eyebrow">
        {t("me.submissions.eyebrow", undefined, "My submissions")}
      </div>
      <h1 className="mt-1">{t("me.submissions.title", undefined, "Submissions")}</h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t("me.submissions.subtitle", undefined, "Open-call submissions you've made.")}
      </p>

      {submitted === "1" && (
        <div className="mt-4">
          <Alert kind="success">
            {t(
              "me.submissions.submittedBanner",
              undefined,
              "Submission received. You'll see shortlist and award updates here.",
            )}
          </Alert>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t("me.submissions.empty.title", undefined, "No submissions yet")}
            description={t(
              "me.submissions.empty.description",
              undefined,
              "Open calls you've responded to will appear here.",
            )}
            action={
              <Button href="/marketplace/calls">
                {t("me.submissions.empty.action", undefined, "Browse open calls")}
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="surface-raised flex items-center justify-between p-4">
              <div>
                <Link href={`/me/submissions/${r.id}`} className="text-sm font-semibold">
                  {r.open_call?.title ?? t("me.submissions.deletedCall", undefined, "(deleted call)")}
                </Link>
                <p className="mt-1 text-xs text-[var(--p-text-2)]">
                  {t(
                    "me.submissions.submittedOn",
                    { date: fmt.date(new Date(r.submitted_at)) },
                    `Submitted ${fmt.date(new Date(r.submitted_at))}`,
                  )}
                </p>
              </div>
              <Badge variant={STATUS_TONE[r.submission_state] ?? "muted"}>{toTitle(r.submission_state)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
