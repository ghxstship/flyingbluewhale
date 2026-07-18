import Link from "next/link";
import { notFound } from "next/navigation";
import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import {
  CATALOG_KIND_LABEL_SINGULAR,
  deriveMealSummary,
  type CatalogKind,
  type FulfillmentState,
} from "@/lib/db/assignments";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { RosterLock } from "../../RosterLock";
import { getOrgLetter } from "../../shared";

export const dynamic = "force-dynamic";

/**
 * Kit 30 · /m/roster/[engagementId]/advance — the person's advance lines,
 * read-first. Each card maps the assignment's fulfillment_state onto the
 * 3-stage mini-track (submitted/in_review → Requested · approved → Approved ·
 * delivered/issued → Fulfilled); catering cards derive the meal summary from
 * catering_assignment_details via the shared `deriveMealSummary`. Line-level
 * actions (approve, fulfill) stay console-side and on the POS scan flow.
 */

const KIND_ICON: Record<string, string> = {
  ticket: "Ticket",
  credential: "BadgeCheck",
  catering: "Utensils",
  radio: "RadioTower",
  tool: "Wrench",
  equipment: "Package",
  uniform: "Shirt",
  travel: "Plane",
  lodging: "BedDouble",
  vehicle: "Car",
  labor: "Users",
};

/** requested=0 · approved=1 · fulfilled=2 · null → terminal odd state. */
function trackStage(state: FulfillmentState): 0 | 1 | 2 | null {
  if (["briefed", "draft", "submitted", "in_review", "revision_requested"].includes(state)) return 0;
  if (state === "approved") return 1;
  if (["delivered", "issued", "transferred", "redeemed"].includes(state)) return 2;
  return null; // rejected / voided / expired / returned
}

type LineRow = {
  id: string;
  catalog_kind: CatalogKind;
  fulfillment_state: FulfillmentState;
  title: string | null;
  deadline: string | null;
  data: Record<string, unknown> | null;
  catalog_item: { name: string | null } | null;
};

export default async function AdvancePage({ params }: { params: Promise<{ engagementId: string }> }) {
  const { engagementId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();

  const title = t("m.roster.advance.title", undefined, "Advance");

  if (!can(session, "people:manage")) {
    return (
      <RosterLock
        eyebrow={t("m.roster.advance.eyebrow", undefined, "Advance")}
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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assignments")
    .select("id, catalog_kind, fulfillment_state, title, deadline, data, catalog_item:catalog_item_id(name)")
    .eq("org_id", session.orgId)
    .eq("project_id", letter.raw.project_id)
    .eq("party_crew_id", letter.raw.crew_member_id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  const lines = (data ?? []) as unknown as LineRow[];

  // Catering detail siblings — one batched read for the meal summaries.
  const cateringIds = lines.filter((l) => l.catalog_kind === "catering").map((l) => l.id);
  const cateringById = new Map<
    string,
    { meal_periods: string[]; starts_on: string | null; ends_on: string | null; every_contract_day: boolean; excluded_dates: string[] }
  >();
  if (cateringIds.length > 0) {
    const { data: details } = await supabase
      .from("catering_assignment_details")
      .select("assignment_id, meal_periods, starts_on, ends_on, every_contract_day, excluded_dates")
      .in("assignment_id", cateringIds);
    for (const d of details ?? []) {
      cateringById.set(d.assignment_id, {
        meal_periods: d.meal_periods ?? [],
        starts_on: d.starts_on,
        ends_on: d.ends_on,
        every_contract_day: d.every_contract_day,
        excluded_dates: d.excluded_dates ?? [],
      });
    }
  }

  const mmmD = (d: string | null) => (d ? fmt.dateParts(d, { month: "short", day: "numeric" }) : null);
  const contractRange = [mmmD(letter.raw.onsite_start_date), mmmD(letter.raw.onsite_end_date)]
    .filter(Boolean)
    .join(" → ");

  const stageLabels = [
    t("m.roster.advance.stage.requested", undefined, "Requested"),
    t("m.roster.advance.stage.approved", undefined, "Approved"),
    t("m.roster.advance.stage.fulfilled", undefined, "Fulfilled"),
  ];
  const terminalLabel: Record<string, string> = {
    rejected: t("m.roster.advance.state.rejected", undefined, "Rejected"),
    voided: t("m.roster.advance.state.voided", undefined, "Voided"),
    expired: t("m.roster.advance.state.expired", undefined, "Expired"),
    returned: t("m.roster.advance.state.returned", undefined, "Returned"),
  };

  return (
    <div className="screen screen-anim">
      <Link href={`/m/roster/${engagementId}/contract`} className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.roster.onboarding.back", undefined, "Contract")}
      </Link>
      <div className="scr-eye">
        {t(
          "m.roster.advance.eyebrowFor",
          { name: letter.resolved.recipient_name },
          `${letter.resolved.recipient_name} · Advance`,
        )}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

      {lines.length === 0 ? (
        <EmptyState
          title={t("m.roster.advance.empty.title", undefined, "No Advance Yet")}
          description={t(
            "m.roster.advance.empty.body",
            undefined,
            "Advance lines for this person show up here. Assemble the cart from the console's advancing surface.",
          )}
        />
      ) : (
        lines.map((l) => {
          const stage = trackStage(l.fulfillment_state);
          const itemName = l.title ?? l.catalog_item?.name ?? t("m.roster.advance.untitled", undefined, "Item");
          const catering = l.catalog_kind === "catering" ? cateringById.get(l.id) : undefined;
          const cateringRange = catering
            ? [mmmD(catering.starts_on), mmmD(catering.ends_on)].filter(Boolean).join(" → ")
            : "";
          // Kit 31 #4 — every line carries data.starts_on/ends_on now; the
          // per-line window outranks the deadline/contract fallbacks.
          const extra = (l.data ?? {}) as Record<string, unknown>;
          const lineRange = [
            typeof extra.starts_on === "string" ? mmmD(extra.starts_on) : null,
            typeof extra.ends_on === "string" ? mmmD(extra.ends_on) : null,
          ]
            .filter(Boolean)
            .join(" → ");
          const dates =
            cateringRange ||
            lineRange ||
            (l.deadline
              ? t("m.roster.advance.due", { date: mmmD(l.deadline) ?? "" }, `Due ${mmmD(l.deadline) ?? ""}`)
              : contractRange);
          return (
            <div className="item" key={l.id} style={{ alignItems: "flex-start" }}>
              <span className="avatar-sm">
                <KIcon name={KIND_ICON[l.catalog_kind] ?? "Package"} size={16} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{`${CATALOG_KIND_LABEL_SINGULAR[l.catalog_kind]} · ${itemName}`}</div>
                {dates ? <div className="s">{dates}</div> : null}
                {catering && (
                  <div className="s" style={{ marginTop: 2 }}>
                    {catering.every_contract_day
                      ? t("m.roster.advance.everyDay", undefined, "Every Contract Day")
                      : null}
                    {catering.every_contract_day ? " · " : ""}
                    {deriveMealSummary(catering).label}
                  </div>
                )}
                {stage !== null ? (
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }} aria-label={stageLabels[stage]}>
                    {stageLabels.map((s, i) => (
                      <span key={s} className={`chip${i <= stage ? " on" : ""}`} style={{ cursor: "default" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <span className="ps-badge ps-badge--neutral">
                      {terminalLabel[l.fulfillment_state] ?? l.fulfillment_state}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      <div className="s" style={{ color: "var(--p-text-3)", marginTop: 12 }}>
        {t(
          "m.roster.advance.readOnlyNote",
          undefined,
          "Approvals and fulfillment run from the console and the POS scanner.",
        )}
      </div>
    </div>
  );
}
