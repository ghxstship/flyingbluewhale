import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { ReviewPanel, type Reviewer, type PersonOpt } from "./ReviewPanel";

export const dynamic = "force-dynamic";

type DeliverableRow = {
  id: string;
  title: string;
  type: string;
  fulfillment_state: string;
  deadline: string | null;
};

/**
 * Deliverable review surface (kit 21 W2, Frame.io canon) — the home for the
 * multi-reviewer tally. Shows the doc-spec plus its reviewer roster; managers
 * assign reviewers, each reviewer approves or requests changes, and the header
 * carries the "N Of M Approved" count.
 */
export default async function DeliverableReviewPage({
  params,
}: {
  params: Promise<{ deliverableId: string }>;
}) {
  const { deliverableId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();

  const { data: deliverable } = await supabase
    .from("deliverables")
    .select("id, title, type, fulfillment_state, deadline")
    .eq("id", deliverableId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!deliverable) notFound();
  const doc = deliverable as unknown as DeliverableRow;

  const { data: reviewerRows } = await supabase
    .from("deliverable_reviewers")
    .select("reviewer_id, review_state, reviewer:reviewer_id(name, email)")
    .eq("org_id", session.orgId)
    .eq("deliverable_id", deliverableId)
    .order("assigned_at", { ascending: true });

  const reviewers: Reviewer[] = (
    (reviewerRows ?? []) as unknown as Array<{
      reviewer_id: string;
      review_state: Reviewer["reviewState"];
      reviewer: { name: string | null; email: string | null } | null;
    }>
  ).map((r) => ({
    reviewerId: r.reviewer_id,
    name: r.reviewer?.name ?? r.reviewer?.email ?? r.reviewer_id,
    reviewState: r.review_state,
  }));

  const approved = reviewers.filter((r) => r.reviewState === "approved").length;
  const changesRequested = reviewers.some((r) => r.reviewState === "changes_requested");

  // People directory for the reviewer picker (org members).
  const { data: orgMembers } = await supabase
    .from("memberships")
    .select("user_id, users:users!inner(id, name, email)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .limit(200);
  const people: PersonOpt[] = (
    (orgMembers ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; name: string | null; email: string | null } | null;
    }>
  )
    .map((m) => ({ id: m.user_id, label: m.users?.name ?? m.users?.email ?? m.user_id }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.advancing.deliverable.eyebrow", undefined, "Deliverable")}
        title={doc.title}
        breadcrumbs={[
          { label: t("console.advancing.title", undefined, "Advancing"), href: "/studio/advancing" },
          { label: doc.title },
        ]}
        action={
          <div className="flex items-center gap-2">
            {reviewers.length > 0 && (
              <Badge variant={changesRequested ? "warning" : approved === reviewers.length ? "success" : "muted"}>
                {t(
                  "console.advancing.deliverable.approvedTally",
                  { approved, total: reviewers.length },
                  `${approved} Of ${reviewers.length} Approved`,
                )}
              </Badge>
            )}
            <StatusBadge status={doc.fulfillment_state} />
          </div>
        }
      />
      <div className="page-content max-w-2xl space-y-5">
        <div className="surface p-5">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-[var(--p-text-3)]">{t("console.advancing.deliverable.type", undefined, "Type")}</dt>
              <dd className="mt-0.5 capitalize">{doc.type.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--p-text-3)]">
                {t("console.advancing.deliverable.deadline", undefined, "Deadline")}
              </dt>
              <dd className="mt-0.5">{doc.deadline ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <ReviewPanel
          deliverableId={doc.id}
          reviewers={reviewers}
          people={people}
          canManage={isManagerPlus(session)}
          currentUserId={session.userId}
          labels={{
            heading: t("console.advancing.deliverable.reviewers", undefined, "Reviewers"),
            addReviewer: t("console.advancing.deliverable.addReviewer", undefined, "Add Reviewer"),
            pick: t("console.advancing.deliverable.pickReviewer", undefined, "Pick a person"),
            approve: t("console.advancing.deliverable.approve", undefined, "Approve"),
            requestChanges: t("console.advancing.deliverable.requestChanges", undefined, "Request Changes"),
            reset: t("console.advancing.deliverable.reset", undefined, "Reset"),
            remove: t("console.advancing.deliverable.remove", undefined, "Remove"),
            empty: t(
              "console.advancing.deliverable.noReviewers",
              undefined,
              "Add reviewers to route this deliverable for approval.",
            ),
          }}
        />
      </div>
    </>
  );
}
