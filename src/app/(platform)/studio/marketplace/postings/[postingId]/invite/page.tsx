import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { InviteForm, type InviteRow } from "./InviteForm";

export const dynamic = "force-dynamic";

/**
 * Bulk casting invite v1 — pick acts from the org roster, invite them to
 * apply to this posting. See actions.ts for the fan-out contract and the
 * deliberate v1 boundaries.
 */
export default async function InviteTalentPage({ params }: { params: Promise<{ postingId: string }> }) {
  const { t } = await getRequestT();
  const { postingId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: posting }, { data: talent }] = await Promise.all([
    supabase
      .from("job_postings")
      .select("id, title, job_posting_phase")
      .eq("id", postingId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("talent_profiles")
      .select("id, act_name, user_id, genre_tags")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("act_name")
      .limit(200),
  ]);
  if (!posting) notFound();
  const p = posting as { id: string; title: string; job_posting_phase: string };

  const rows: InviteRow[] = ((talent ?? []) as Array<{
    id: string;
    act_name: string;
    user_id: string | null;
    genre_tags: string[] | null;
  }>).map((row) => ({
    id: row.id,
    actName: row.act_name,
    claimed: !!row.user_id,
    genreLine: row.genre_tags?.length ? row.genre_tags.slice(0, 4).join(" / ") : null,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.invite.eyebrow", undefined, "Casting")}
        title={t("console.marketplace.invite.title", undefined, "Invite Talent")}
        subtitle={p.title}
      />
      <div className="page-content max-w-2xl space-y-4">
        {p.job_posting_phase !== "published" ? (
          <p className="text-sm text-[var(--p-warning-text,var(--p-warning))]">
            {t(
              "console.marketplace.invite.publishFirst",
              undefined,
              "This posting is not published yet. Publish it before sending invites.",
            )}
          </p>
        ) : null}
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.marketplace.invite.emptyTitle", undefined, "No Talent Profiles")}
            description={t(
              "console.marketplace.invite.emptyDescription",
              undefined,
              "Add acts to your talent roster first, then invite them to apply here.",
            )}
          />
        ) : (
          <InviteForm
            postingId={p.id}
            rows={rows}
            labels={{
              submit: t("console.marketplace.invite.submit", undefined, "Send Invites"),
              sent: t("console.marketplace.invite.sent", undefined, "Invited {count} acts. Each got an inbox note and an email."),
              unclaimed: t("console.marketplace.invite.unclaimed", undefined, "No account"),
            }}
          />
        )}
      </div>
    </>
  );
}
