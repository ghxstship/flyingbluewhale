import Link from "next/link";
import { fmtPosition } from "@/lib/mobile/fmt-position";
import { notFound } from "next/navigation";
import { can, requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { BASIS_LABEL } from "@/lib/offer-letters/types";
import { displayRoleTitle, formatDollars } from "@/lib/offer-letters/format";
import { urlFor } from "@/lib/urls";
import { KIcon } from "@/components/mobile/kit";
import { RosterLock } from "../../RosterLock";
import { getOrgLetter } from "../../shared";

export const dynamic = "force-dynamic";

/**
 * Kit 30 · /m/roster/[engagementId]/contract — read-first contract detail.
 * Status track (Draft → Sent → Accepted with dates), kv record grid, and an
 * Amend deep link into the console letter editor. No signed-PDF link: the
 * letter lib exposes no rendered artifact URL (the signed record is the
 * accepted snapshot row), and fabricating one is worse than omitting it.
 */
export default async function ContractPage({ params }: { params: Promise<{ engagementId: string }> }) {
  const { engagementId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();

  if (!can(session, "people:manage")) {
    return (
      <RosterLock
        eyebrow={t("m.roster.contract.eyebrow", undefined, "Contract")}
        title={t("m.roster.contract.title", undefined, "Contract")}
        body={t("m.roster.lock.body", undefined, "Managing the project roster requires the capability")}
        capability="people:manage"
        backHref="/m/roster"
        backLabel={t("m.roster.assign.back", undefined, "Back To Roster")}
      />
    );
  }

  const letter = await getOrgLetter(session.orgId, engagementId);
  if (!letter) notFound();
  const r = letter.resolved;
  const fmt = await getRequestFormatters();

  const accepted = r.status === "accepted" || !!r.accepted_at;
  const sent = accepted || !!r.sent_at || r.status === "sent" || r.status === "viewed";
  const negative =
    r.status === "declined" || r.status === "withdrawn" || r.status === "expired" ? (r.status as string) : null;

  const terms = [
    BASIS_LABEL[r.compensation_basis],
    r.effective_compensation_cents > 0 ? formatDollars(r.effective_compensation_cents) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const signature = accepted
    ? t(
        "m.roster.contract.signed",
        { date: fmt.date(r.accepted_at ?? undefined, "medium") },
        `Signed ${fmt.date(r.accepted_at ?? undefined, "medium")}`,
      )
    : r.status === "declined"
      ? t("m.roster.contract.declined", undefined, "Declined")
      : t("m.roster.contract.awaiting", undefined, "Awaiting Signature");

  const track: Array<{ label: string; done: boolean; current: boolean; date: string | null }> = [
    {
      label: t("m.roster.contract.track.draft", undefined, "Draft"),
      done: sent || accepted,
      current: !sent && !accepted,
      date: fmt.date(r.created_at, "medium"),
    },
    {
      label: t("m.roster.contract.track.sent", undefined, "Sent"),
      done: sent,
      current: sent && !accepted,
      date: r.sent_at ? fmt.date(r.sent_at, "medium") : null,
    },
    {
      label: t("m.roster.contract.track.accepted", undefined, "Accepted"),
      done: accepted,
      current: accepted,
      date: r.accepted_at ? fmt.date(r.accepted_at, "medium") : null,
    },
  ];

  const kv: Array<{ k: string; v: string; tone?: string }> = [
    { k: t("m.roster.contract.role", undefined, "Role"), v: fmtPosition(displayRoleTitle(r.role_slug, r.role_title, r.expectations_override)) },
    {
      k: t("m.roster.contract.start", undefined, "Start"),
      v: r.effective_onsite_start ? fmt.date(r.effective_onsite_start, "medium") : t("m.roster.tbd", undefined, "TBD"),
    },
    {
      k: t("m.roster.contract.end", undefined, "End"),
      v: r.effective_onsite_end ? fmt.date(r.effective_onsite_end, "medium") : t("m.roster.tbd", undefined, "TBD"),
    },
    { k: t("m.roster.contract.terms", undefined, "Terms"), v: terms || t("m.roster.tbd", undefined, "TBD") },
    {
      k: t("m.roster.contract.rateCard", undefined, "Rate Card"),
      v: r.rate_name ?? t("m.roster.contract.manualRate", undefined, "Manual"),
    },
    {
      k: t("m.roster.contract.signature", undefined, "Signature"),
      v: signature,
      tone: accepted ? "var(--p-success)" : negative ? "var(--p-danger)" : "var(--p-warning)",
    },
  ];

  return (
    <div className="screen screen-anim">
      <Link href="/m/roster" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.roster.title", undefined, "Project Roster")}
      </Link>
      <div className="scr-eye">
        {t("m.roster.contract.eyebrowFor", { name: r.recipient_name }, `${r.recipient_name} · Contract`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {fmtPosition(displayRoleTitle(r.role_slug, r.role_title, r.expectations_override))}
      </h1>

      {negative && (
        <div className="ps-alert ps-alert--warn" role="status" style={{ marginBottom: 12 }}>
          {negative === "declined"
            ? t("m.roster.contract.negative.declined", undefined, "This offer was declined.")
            : negative === "withdrawn"
              ? t("m.roster.contract.negative.withdrawn", undefined, "This offer was withdrawn.")
              : t("m.roster.contract.negative.expired", undefined, "This offer expired before signature.")}
        </div>
      )}

      <div className="lifecycle">
        {track.map((s) => (
          <div className="lc-step" key={s.label}>
            <span className={`lc-dot${s.done ? " done" : s.current ? " next" : ""}`}>
              {s.done ? <KIcon name="Check" size={13} /> : null}
            </span>
            <span className="lc-l">
              {s.label}
              {s.done && s.date ? ` · ${s.date}` : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="rec-grid">
        {kv.map((cell) => (
          <div className="rec-cell" key={cell.k}>
            <div className="rec-k">{cell.k}</div>
            <div className="rec-v" style={cell.tone ? { color: cell.tone } : undefined}>
              {cell.v}
            </div>
          </div>
        ))}
      </div>

      {accepted && (
        <div className="s" style={{ color: "var(--p-text-3)", marginBottom: 16 }}>
          {t(
            "m.roster.contract.acceptedNote",
            undefined,
            "Accepted from the offer link. Amendments re-issue for signature.",
          )}
        </div>
      )}

      <Link href={`/m/roster/${engagementId}/onboarding`} className="item tap" style={{ cursor: "pointer" }}>
        <span className="avatar-sm">
          <KIcon name="ClipboardList" size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{t("m.roster.contract.onboardingLink", undefined, "Onboarding Packet")}</div>
          <div className="s">{t("m.roster.contract.onboardingSub", undefined, "Docs, Reminders & Waivers")}</div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)", flex: "none" }} />
      </Link>
      <Link href={`/m/roster/${engagementId}/advance`} className="item tap" style={{ cursor: "pointer" }}>
        <span className="avatar-sm">
          <KIcon name="ShoppingCart" size={16} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{t("m.roster.contract.advanceLink", undefined, "Advance")}</div>
          <div className="s">{t("m.roster.contract.advanceSub", undefined, "Credentials, Vehicles & Catering")}</div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)", flex: "none" }} />
      </Link>

      <a
        href={urlFor("platform", `/studio/people/offer-letters/${engagementId}`)}
        className="ps-btn ps-btn--secondary"
        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
      >
        {t("m.roster.contract.amend", undefined, "Amend In Console")}
      </a>
    </div>
  );
}
