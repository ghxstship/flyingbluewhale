import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { can, requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { listOfferLetters } from "@/lib/offer-letters/queries";
import { STATUS_LABEL } from "@/lib/offer-letters/types";
import { listOnboardingByProject } from "@/lib/db/onboarding";
import { EmptyState } from "@/components/ui/EmptyState";
import { RosterLock } from "./RosterLock";
import { RosterList, type RosterRow } from "./RosterList";
import { LETTER_STATE_TONE, initialsFor, resolveActiveProject } from "./shared";

export const dynamic = "force-dynamic";

/**
 * Kit 30 · /m/roster — the ACTIVE project's engagements as a card list.
 * One row per offer letter (the engagement record: person × project × role ×
 * rate × dates × reporting edge). Manager-gated on `people:manage`; the
 * member band gets the capability-named lock screen, never a blank 403.
 */

// The 11-value letter_state label map — Title Case, roster voice. The shared
// STATUS_LABEL covers the original 7; the enum's later additions
// (countersigned/active/superseded/voided) are labeled here without editing
// the shared lib out from under the console letter pages.
const EXTENDED_STATE_LABEL: Record<string, string> = {
  countersigned: "Countersigned",
  active: "Contracted",
  superseded: "Superseded",
  voided: "Voided",
};

export default async function RosterPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();

  const eyebrowBase = t("m.roster.eyebrow", undefined, "People");
  const title = t("m.roster.title", undefined, "Project Roster");

  if (!can(session, "people:manage")) {
    return (
      <RosterLock
        eyebrow={eyebrowBase}
        title={title}
        body={t("m.roster.lock.body", undefined, "Managing the project roster requires the capability")}
        capability="people:manage"
        backHref="/m/more"
        backLabel={t("m.roster.lock.back", undefined, "Back To More")}
      />
    );
  }

  const project = await resolveActiveProject(session.orgId);
  if (!project) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{eyebrowBase}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {title}
        </h1>
        <EmptyState
          icon={<FolderOpen size={28} aria-hidden="true" />}
          title={t("m.roster.noProject.title", undefined, "No Live Project")}
          description={t(
            "m.roster.noProject.body",
            undefined,
            "The roster follows the active project. Activate one from the console and it appears here.",
          )}
        />
      </div>
    );
  }

  const fmt = await getRequestFormatters();
  const [letters, onboarding] = await Promise.all([
    listOfferLetters(session.orgId, project.id),
    listOnboardingByProject(session.orgId, project.id),
  ]);
  const docsByLetter = new Map(onboarding.map((o) => [o.letter_id, o]));

  const mmmD = (d: string | null) => (d ? fmt.dateParts(d, { month: "short", day: "numeric" }) : null);

  const rows: RosterRow[] = letters
    .filter((l) => l.status !== "withdrawn")
    .map((l) => {
      const start = mmmD(l.effective_onsite_start);
      const end = mmmD(l.effective_onsite_end);
      const range = start && end ? `${start} → ${end}` : (start ?? end ?? t("m.roster.datesTbd", undefined, "Dates TBD"));
      const docs = docsByLetter.get(l.id);
      return {
        id: l.id,
        name: l.recipient_name,
        initials: initialsFor(l.recipient_name),
        sub: `${l.role_title} · ${range}`,
        docs:
          docs && docs.total > 0
            ? t("m.roster.docsCount", { done: docs.done, total: docs.total }, `Docs ${docs.done}/${docs.total}`)
            : "",
        stateLabel:
          STATUS_LABEL[l.status as keyof typeof STATUS_LABEL] ?? EXTENDED_STATE_LABEL[l.status as string] ?? l.status,
        tone: LETTER_STATE_TONE[l.status as string] ?? "neutral",
      };
    });

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {t(
          "m.roster.eyebrowCount",
          { project: project.name, count: rows.length },
          `${project.name} · ${rows.length} On Roster`,
        )}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>
      <RosterList rows={rows} />
      <div style={{ marginTop: 16 }}>
        <Link href="/m/roster/reporting" className="s" style={{ color: "var(--p-accent-text)", fontWeight: 600 }}>
          {t("m.roster.reportingLink", undefined, "Reporting Structure")}
        </Link>
      </div>
    </div>
  );
}
