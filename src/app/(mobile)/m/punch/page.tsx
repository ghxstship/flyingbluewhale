import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { PhotoStrip } from "@/components/media/PhotoStrip";
import { signPhotoRefsFor } from "@/lib/mobile/photo-sign";

export const dynamic = "force-dynamic";

/** Must match the bucket `raiseSnag` (/m/snags) uploads to. */
const PUNCH_PHOTO_BUCKET = "procore-parity";

/**
 * COMPVSS · Punch List — the org-wide inspection punch list, the field view
 * of the SAME `punch_items` store the console reads at /studio/punch.
 *
 * Kit 29 ratified this route as the punch LIST: items with status tones,
 * photo evidence, assignee, row opens the record. The previous occupant of
 * this route was a duplicate punch-in/out time surface; punching in and out
 * lives on /m/clock (the spec's Time Clock), so the time twin yielded.
 *
 * Deliberately org-wide (RLS: punch_items select is org-member-readable).
 * The MY-raised slice lives at /m/snags; this is the whole queue. No
 * `deleted_at` guard — punch_items has no soft-delete column.
 */
type PunchRow = {
  id: string;
  code: string;
  title: string;
  item_state: string;
  priority: string;
  photo_path: string | null;
  due_at: string | null;
  created_at: string;
  project: { name: string | null } | null;
  assignee: { name: string | null; email: string | null } | null;
};

// Kit 29 semantic-tone convention for this surface: open reads info,
// in-flight reads warning, closed reads success. Void is a neutral tombstone.
const STATE_TONE: Record<string, string> = {
  open: "info",
  in_progress: "warn",
  ready_for_review: "warn",
  complete: "ok",
  void: "neutral",
};

const PRIORITY_TONE: Record<string, string> = {
  low: "neutral",
  normal: "neutral",
  high: "warn",
  urgent: "danger",
};

export default async function PunchListPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.punchList.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("punch_items")
    .select(
      "id, code, title, item_state, priority, photo_path, due_at, created_at, project:project_id(name), assignee:assignee_id(name, email)",
    )
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(100);
  const items = (data ?? []) as unknown as PunchRow[];

  // Sign the photo evidence — same idiom as /m/snags: the caller's client
  // signs, so RLS stays the gate.
  const photosById = await signPhotoRefsFor(supabase, PUNCH_PHOTO_BUCKET, items, (i) =>
    i.photo_path ? [i.photo_path] : [],
  );

  const STATE_LABEL: Record<string, string> = {
    open: t("m.punchList.state.open", undefined, "Open"),
    in_progress: t("m.punchList.state.inProgress", undefined, "In Progress"),
    ready_for_review: t("m.punchList.state.readyForReview", undefined, "In Review"),
    complete: t("m.punchList.state.complete", undefined, "Closed"),
    void: t("m.punchList.state.void", undefined, "Void"),
  };
  const PRIORITY_LABEL: Record<string, string> = {
    low: t("m.punchList.priority.low", undefined, "Low"),
    normal: t("m.punchList.priority.normal", undefined, "Normal"),
    high: t("m.punchList.priority.high", undefined, "High"),
    urgent: t("m.punchList.priority.urgent", undefined, "Urgent"),
  };

  const openCount = items.filter((i) => !["complete", "void"].includes(i.item_state)).length;

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.punchList.eyebrow", undefined, "Site")}</div>
      <h1 className="scr-h" style={{ marginBottom: 4 }}>
        {t("m.punchList.title", undefined, "Punch List")}
      </h1>
      <div className="s" style={{ marginBottom: 12 }}>
        {t("m.punchList.openCount", { n: openCount }, `${openCount} Open`)}
      </div>

      {items.length === 0 ? (
        <EmptyState
          size="compact"
          icon={<ClipboardCheck size={28} aria-hidden="true" />}
          title={t("m.punchList.empty.title", undefined, "Nothing On The List")}
          description={t(
            "m.punchList.empty.body",
            undefined,
            "Inspection items land here as they are raised. Spot something wrong? Raise a snag and it joins the queue.",
          )}
        />
      ) : (
        items.map((i) => (
          <Link
            href={`/m/punch/${i.id}`}
            className="item tap"
            key={i.id}
            style={{ display: "block", textDecoration: "none", color: "inherit" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{i.title}</div>
                <div className="s">
                  {i.code}
                  {i.project?.name ? ` · ${i.project.name}` : ""}
                  {` · ${fmt.date(i.created_at)}`}
                </div>
                <div className="s">
                  {i.assignee
                    ? t(
                        "m.punchList.assignedTo",
                        { name: i.assignee.name ?? i.assignee.email ?? "" },
                        `Assigned · ${i.assignee.name ?? i.assignee.email ?? ""}`,
                      )
                    : t("m.punchList.unassigned", undefined, "Unassigned")}
                </div>
              </div>
              <div style={{ textAlign: "right", flex: "none", display: "grid", gap: 4, justifyItems: "end" }}>
                <span className={`ps-badge ps-badge--${STATE_TONE[i.item_state] ?? "neutral"}`}>
                  {STATE_LABEL[i.item_state] ?? i.item_state}
                </span>
                {(i.priority === "high" || i.priority === "urgent") && (
                  <span className={`ps-badge ps-badge--${PRIORITY_TONE[i.priority] ?? "neutral"}`}>
                    {PRIORITY_LABEL[i.priority] ?? i.priority}
                  </span>
                )}
              </div>
            </div>
            <PhotoStrip photos={photosById.get(i.id) ?? []} label={i.title} />
          </Link>
        ))
      )}

      <Link
        href="/m/snags/new"
        className="ps-btn ps-btn--secondary ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
      >
        <KIcon name="Camera" size={16} /> {t("m.punchList.raiseSnag", undefined, "Raise A Snag")}
      </Link>
    </div>
  );
}
