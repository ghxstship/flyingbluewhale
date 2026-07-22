import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
import { PhotoStrip } from "@/components/media/PhotoStrip";
import { signPhotoRefs } from "@/lib/mobile/photo-sign";
import { advancePunchItem } from "./actions";

export const dynamic = "force-dynamic";

/** Must match the bucket `raiseSnag` (/m/snags) uploads to. */
const PUNCH_PHOTO_BUCKET = "procore-parity";

/**
 * COMPVSS · Punch item detail — the record behind a /m/punch row: photo
 * evidence, description, state, assignee, timestamps.
 *
 * Transitions reuse the console's `transitionPunchItem` server action
 * (/studio/punch/[id]/actions.ts) — same FSM, same concurrency guard, no
 * new write path. Surfaced for the manager band only; everyone else reads.
 */
type ItemRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  item_state: string;
  priority: string;
  photo_path: string | null;
  due_at: string | null;
  closed_at: string | null;
  created_at: string;
  show_ready_gate: boolean;
  project: { name: string | null } | null;
  assignee: { name: string | null; email: string | null } | null;
};

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

export default async function PunchItemPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
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
      "id, code, title, description, item_state, priority, photo_path, due_at, closed_at, created_at, show_ready_gate, project:project_id(name), assignee:assignee_id(name, email)",
    )
    .eq("org_id", session.orgId)
    .eq("id", itemId)
    .maybeSingle();
  const item = data as unknown as ItemRow | null;
  if (!item) notFound();

  const photos = await signPhotoRefs(supabase, PUNCH_PHOTO_BUCKET, item.photo_path ? [item.photo_path] : []);

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

  // The console FSM's forward path, surfaced as one next-step button per
  // state. Kick-backs and voids stay console-side.
  const nextStep: { to: "in_progress" | "ready_for_review" | "complete"; label: string } | null =
    item.item_state === "open"
      ? { to: "in_progress", label: t("m.punchList.detail.start", undefined, "Start Work") }
      : item.item_state === "in_progress"
        ? { to: "ready_for_review", label: t("m.punchList.detail.markReady", undefined, "Mark Ready For Review") }
        : item.item_state === "ready_for_review"
          ? { to: "complete", label: t("m.punchList.detail.close", undefined, "Close Item") }
          : null;
  const canTransition = isManagerPlus(session) && nextStep !== null;

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.punchList.detail.eyebrow", undefined, "Punch List")}</div>
      <h1 className="scr-h" style={{ marginBottom: 8 }}>
        {item.title}
      </h1>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <span className={`ps-badge ps-badge--${STATE_TONE[item.item_state] ?? "neutral"}`}>
          {STATE_LABEL[item.item_state] ?? item.item_state}
        </span>
        <span className={`ps-badge ps-badge--${PRIORITY_TONE[item.priority] ?? "neutral"}`}>
          {PRIORITY_LABEL[item.priority] ?? item.priority}
        </span>
        {item.show_ready_gate && (
          <span className="ps-badge ps-badge--danger">{t("m.punchList.detail.doorsGate", undefined, "Doors Gate")}</span>
        )}
      </div>

      <div className="item" style={{ display: "block" }}>
        <div className="s">
          {[item.code, item.project?.name].filter(Boolean).join(" · ")}
        </div>
        {item.description ? (
          <p className="form-intro" style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
            {item.description}
          </p>
        ) : null}
      </div>

      <div className="item" style={{ display: "block" }}>
        <div className="t">
          {item.assignee
            ? (item.assignee.name ?? item.assignee.email ?? "")
            : t("m.punchList.unassigned", undefined, "Unassigned")}
        </div>
        <div className="s">{t("m.punchList.detail.assignee", undefined, "Assignee")}</div>
      </div>

      <div className="item" style={{ display: "block" }}>
        <div className="s">
          {t("m.punchList.detail.raised", { date: fmt.date(item.created_at) }, `Raised ${fmt.date(item.created_at)}`)}
          {item.due_at
            ? ` · ${t("m.punchList.detail.due", { date: fmt.date(item.due_at + "T00:00:00") }, `Due ${fmt.date(item.due_at + "T00:00:00")}`)}`
            : ""}
          {item.closed_at
            ? ` · ${t("m.punchList.detail.closed", { date: fmt.date(item.closed_at) }, `Closed ${fmt.date(item.closed_at)}`)}`
            : ""}
        </div>
      </div>

      {item.photo_path && (
        <>
          <div className="sech">
            <h2>{t("m.punchList.detail.evidence", undefined, "Evidence")}</h2>
          </div>
          {photos.length === 0 || !photos.some((p) => p.url) ? (
            <div className="hint">
              {t("m.punchList.detail.noPreview", undefined, "A photo is attached but can't be previewed right now.")}
            </div>
          ) : (
            <PhotoStrip photos={photos} size={104} label={item.title} />
          )}
        </>
      )}

      {canTransition && nextStep && (
        <form action={advancePunchItem.bind(null, item.id, nextStep.to)} style={{ marginTop: 16 }}>
          <button className="ps-btn ps-btn--cta ps-btn--lg" style={{ width: "100%", justifyContent: "center" }} type="submit">
            <KIcon name="ArrowRight" size={16} /> {nextStep.label}
          </button>
        </form>
      )}

      <Link
        href="/m/punch"
        className="ps-btn ps-btn--tertiary ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
      >
        <KIcon name="ChevronLeft" size={15} /> {t("m.punchList.detail.back", undefined, "All Items")}
      </Link>
    </div>
  );
}
