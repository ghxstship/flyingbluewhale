import Link from "next/link";
import { notFound } from "next/navigation";
import { can, requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { listOnboardingSteps, type OnboardingStep } from "@/lib/db/onboarding";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { RosterLock } from "../../RosterLock";
import { getOrgLetter } from "../../shared";
import { OnboardingDocs, type DocRow } from "./OnboardingDocs";
import { CreatePacketButton } from "./CreatePacketButton";

export const dynamic = "force-dynamic";

const STATE_TONE: Record<OnboardingStep["step_state"], string> = {
  pending: "warn",
  in_progress: "info",
  done: "ok",
  waived: "neutral",
  blocked: "neutral",
};

/**
 * Kit 30 · /m/roster/[engagementId]/onboarding — the engagement's doc packet.
 * Progress bar ("N Of M Docs Complete", waived counts as complete — the doc
 * is resolved either way) + doc cards with Send Reminder / Waive riding the
 * existing onboarding lib mutations.
 */
export default async function OnboardingPacketPage({ params }: { params: Promise<{ engagementId: string }> }) {
  const { engagementId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();

  const title = t("m.roster.onboarding.title", undefined, "Onboarding Packet");

  if (!can(session, "people:manage")) {
    return (
      <RosterLock
        eyebrow={t("m.roster.onboarding.eyebrow", undefined, "Onboarding")}
        title={title}
        body={t("m.roster.lock.body", undefined, "Managing the project roster requires the capability")}
        capability="people:manage"
        backHref="/m/roster"
        backLabel={t("m.roster.assign.back", undefined, "Back To Roster")}
      />
    );
  }

  const letter = await getOrgLetter(session.orgId, engagementId);
  if (!letter) notFound();
  const fmt = await getRequestFormatters();
  const steps = await listOnboardingSteps(engagementId);

  const total = steps.length;
  const done = steps.filter((s) => s.step_state === "done" || s.step_state === "waived").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const stateLabel = (s: OnboardingStep["step_state"]) =>
    s === "pending"
      ? t("m.roster.onboarding.state.pending", undefined, "Pending")
      : s === "in_progress"
        ? t("m.roster.onboarding.state.inProgress", undefined, "In Progress")
        : s === "done"
          ? t("m.roster.onboarding.state.done", undefined, "Done")
          : s === "waived"
            ? t("m.roster.onboarding.state.waived", undefined, "Waived")
            : t("m.roster.onboarding.state.blocked", undefined, "Not Started");

  const titleByKey = new Map(steps.map((s) => [s.step_key, s.title]));
  const noteFor = (s: OnboardingStep): string => {
    if (s.step_state === "done" || s.step_state === "waived") {
      return s.completed_at
        ? t(
            "m.roster.onboarding.completedOn",
            { date: fmt.date(s.completed_at, "medium") },
            `Completed ${fmt.date(s.completed_at, "medium")}`,
          )
        : t("m.roster.onboarding.complete", undefined, "Complete");
    }
    if (s.step_state === "blocked") {
      const blockedBy = (s.metadata as { blocked_by?: string } | null)?.blocked_by;
      const blockerTitle = blockedBy ? titleByKey.get(blockedBy) : null;
      return blockerTitle
        ? t("m.roster.onboarding.unlocksAfter", { doc: blockerTitle }, `Unlocks After ${blockerTitle}`)
        : t("m.roster.onboarding.blocked", undefined, "Blocked");
    }
    const remindedAt = (s.metadata as { last_reminded_at?: string } | null)?.last_reminded_at;
    if (remindedAt) {
      return t(
        "m.roster.onboarding.remindedOn",
        { date: fmt.date(remindedAt, "medium") },
        `Reminder Sent ${fmt.date(remindedAt, "medium")}`,
      );
    }
    if (s.due_at) {
      return t("m.roster.onboarding.due", { date: fmt.date(s.due_at, "medium") }, `Due ${fmt.date(s.due_at, "medium")}`);
    }
    return t("m.roster.onboarding.awaiting", undefined, "Awaiting Completion");
  };

  const docs: DocRow[] = steps.map((s) => ({
    id: s.id,
    title: s.title,
    critical: s.critical_path,
    note: noteFor(s),
    stateLabel: stateLabel(s.step_state),
    tone: STATE_TONE[s.step_state] ?? "neutral",
    open: s.step_state === "pending" || s.step_state === "in_progress" || s.step_state === "blocked",
  }));

  return (
    <div className="screen screen-anim">
      <Link href={`/m/roster/${engagementId}/contract`} className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.roster.onboarding.back", undefined, "Contract")}
      </Link>
      <div className="scr-eye">
        {t(
          "m.roster.onboarding.eyebrowFor",
          { name: letter.resolved.recipient_name },
          `${letter.resolved.recipient_name} · Onboarding`,
        )}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

      {total === 0 ? (
        <EmptyState
          title={t("m.roster.onboarding.empty.title", undefined, "No Packet Started")}
          description={t(
            "m.roster.onboarding.empty.body",
            undefined,
            "The 4-doc packet attaches to the engagement. Create it and the docs appear here.",
          )}
          action={
            <CreatePacketButton
              engagementId={engagementId}
              label={t("m.roster.onboarding.empty.cta", undefined, "Create Packet")}
            />
          }
        />
      ) : (
        <>
          {/* Completion semantics — the warn/critical thresholds are for
              consumption meters, not progress toward done. */}
          <ProgressBar
            value={pct}
            severity={pct === 100 ? "success" : "default"}
            aria-label={t("m.roster.onboarding.progressAria", undefined, "Packet Progress")}
            className="mb-2"
          />
          <div className="s" style={{ color: "var(--p-text-3)", marginBottom: 12 }}>
            {t("m.roster.onboarding.progress", { done, total }, `${done} Of ${total} Docs Complete`)}
          </div>
          <OnboardingDocs engagementId={engagementId} docs={docs} />
        </>
      )}
    </div>
  );
}
