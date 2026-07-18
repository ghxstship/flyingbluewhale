import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { PhotoStrip } from "@/components/media/PhotoStrip";
import { signPhotoRefsFor } from "@/lib/mobile/photo-sign";

export const dynamic = "force-dynamic";

/** Must match the bucket `raiseSnag` uploads to. */
const SNAG_PHOTO_BUCKET = "procore-parity";

/**
 * COMPVSS · My Snags — the snags I raised, newest first, into the console
 * punch-list store (`punch_items`).
 *
 * Deliberately self-scoped with an explicit `created_by` filter, the same
 * defensive shape as /m/expenses: punch_items RLS is org-member-readable, so
 * the whole-org queue is one missing predicate away, and the org queue is a
 * console surface (/studio/punch), not this one. No `deleted_at` guard —
 * punch_items has no soft-delete column.
 */
type SnagRow = {
  id: string;
  code: string;
  title: string;
  item_state: string;
  priority: string;
  photo_path: string | null;
  project_id: string;
  created_at: string;
};

const STATE_TONE: Record<string, string> = {
  open: "warn",
  in_progress: "info",
  ready_for_review: "info",
  complete: "ok",
  void: "neutral",
};

const PRIORITY_TONE: Record<string, string> = {
  low: "neutral",
  normal: "neutral",
  high: "warn",
  urgent: "danger",
};

export default async function SnagsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.snags.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("punch_items")
    .select("id, code, title, item_state, priority, photo_path, project_id, created_at")
    .eq("org_id", session.orgId)
    .eq("created_by", session.userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const snags = (data ?? []) as SnagRow[];

  // Sign the photos (a snag report you can't look at is a sentence, not
  // evidence) and resolve project names in one round trip — both depend only
  // on the snag rows, not on each other.
  const projectIds = Array.from(new Set(snags.map((s) => s.project_id)));
  const [photosById, projectsRes] = await Promise.all([
    signPhotoRefsFor(supabase, SNAG_PHOTO_BUCKET, snags, (s) => (s.photo_path ? [s.photo_path] : [])),
    projectIds.length
      ? supabase.from("projects").select("id, name").eq("org_id", session.orgId).in("id", projectIds).is("deleted_at", null)
      : null,
  ]);
  const projectName = new Map<string, string>();
  for (const p of (projectsRes?.data ?? []) as Array<{ id: string; name: string | null }>) {
    projectName.set(p.id, p.name ?? "");
  }

  const STATE_LABEL: Record<string, string> = {
    open: t("m.snags.state.open", undefined, "Open"),
    in_progress: t("m.snags.state.inProgress", undefined, "In Progress"),
    ready_for_review: t("m.snags.state.readyForReview", undefined, "Ready For Review"),
    complete: t("m.snags.state.complete", undefined, "Complete"),
    void: t("m.snags.state.void", undefined, "Void"),
  };
  const PRIORITY_LABEL: Record<string, string> = {
    low: t("m.snags.priority.low", undefined, "Low"),
    normal: t("m.snags.priority.normal", undefined, "Normal"),
    high: t("m.snags.priority.high", undefined, "High"),
    urgent: t("m.snags.priority.urgent", undefined, "Urgent"),
  };

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.snags.eyebrow", undefined, "Site")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.snags.title", undefined, "My Snags")}
      </h1>

      <Link
        href="/m/snags/new"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginBottom: 12 }}
      >
        <KIcon name="Camera" size={16} /> {t("m.snags.new", undefined, "Raise A Snag")}
      </Link>

      {snags.length === 0 ? (
        <EmptyState
          size="compact"
          icon={<ClipboardList size={28} aria-hidden="true" />}
          title={t("m.snags.empty.title", undefined, "No Snags Yet")}
          description={t(
            "m.snags.empty.body",
            undefined,
            "Spot something broken, unsafe or unfinished? Photograph it and it lands on the punch list.",
          )}
        />
      ) : (
        snags.map((s) => (
          <div className="item" key={s.id} style={{ display: "block" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{s.title}</div>
                <div className="s">
                  {s.code}
                  {projectName.get(s.project_id) ? ` · ${projectName.get(s.project_id)}` : ""}
                  {` · ${fmt.date(s.created_at)}`}
                </div>
              </div>
              <div style={{ textAlign: "right", flex: "none", display: "grid", gap: 4, justifyItems: "end" }}>
                <span className={`ps-badge ps-badge--${STATE_TONE[s.item_state] ?? "neutral"}`}>
                  {STATE_LABEL[s.item_state] ?? s.item_state}
                </span>
                {(s.priority === "high" || s.priority === "urgent") && (
                  <span className={`ps-badge ps-badge--${PRIORITY_TONE[s.priority] ?? "neutral"}`}>
                    {PRIORITY_LABEL[s.priority] ?? s.priority}
                  </span>
                )}
              </div>
            </div>
            <PhotoStrip photos={photosById.get(s.id) ?? []} label={s.title} />
          </div>
        ))
      )}
    </div>
  );
}
