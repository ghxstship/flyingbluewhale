"use client";

import { useRouter } from "next/navigation";
import { NormalizedList, SwipeRow, type FieldDef } from "@/components/mobile/kit";
import { fmtPosition } from "@/lib/mobile/fmt-position";

export type RosterPerson = {
  id: string;
  name: string;
  role: string;
  team: string;
  av: string;
  on: boolean;
  status: string;
  phone: string;
  email: string;
  certs: string[];
  source: "crew" | "workforce";
};

// Roster status lifecycle tone map — mirrors ROSTER_STATUS_TONE (app.jsx 874).
const STATUS_TONE: Record<string, string> = {
  Applicant: "neutral",
  Onboarding: "info",
  Available: "info",
  Active: "ok",
  "On Site": "ok",
  "Off Site": "neutral",
  Traveling: "info",
  "On Break": "warn",
  Archived: "neutral",
};
const tone = (s: string) => STATUS_TONE[s] ?? "neutral";

function MBadge({ t, children }: { t: string; children: React.ReactNode }) {
  return <span className={`ps-badge ps-badge--${t}`}>{children}</span>;
}

type Labels = {
  search: string;
  emptyTitle: string;
  emptyBody: string;
  message: string;
  call: string;
  email: string;
  actions: string;
};

/** Kit 34 v3.4 — normalized (NormalizedList: search + View Options/Share drawers
 *  + schema DataView list/gallery/table + team pills). Keeps the kit 32 A6 real
 *  contact intents (Message route + tel:/mailto: swipe actions). Positions
 *  always pass through fmtPosition() before rendering. */
export function DirectoryView({ people, labels }: { people: RosterPerson[]; labels: Labels }) {
  const router = useRouter();
  const allTeams = [...new Set(people.map((p) => p.team))];
  const allRoles = [...new Set(people.map((p) => fmtPosition(p.role)))];
  const allStatuses = [...new Set(people.map((p) => p.status))];

  const FIELDS: FieldDef<RosterPerson>[] = [
    { id: "name", label: "Name", type: "text", get: (p) => p.name },
    { id: "role", label: "Position", type: "select", options: allRoles, get: (p) => fmtPosition(p.role) },
    { id: "team", label: "Team", type: "select", options: allTeams, get: (p) => p.team },
    { id: "status", label: "Status", type: "select", options: allStatuses, get: (p) => p.status },
  ];

  const row = (p: RosterPerson) => (
    <SwipeRow
      key={p.id}
      onClick={() => {}}
      menuTitle={labels.actions}
      actions={[
        { icon: "MessageSquare", label: labels.message, tone: "info", on: () => router.push("/m/inbox") },
        ...(p.phone ? [{ icon: "Phone", label: labels.call, tone: "ok" as const, href: `tel:${p.phone}` }] : []),
        ...(p.email ? [{ icon: "Mail", label: labels.email, tone: "info" as const, href: `mailto:${p.email}` }] : []),
      ]}
    >
      <div className="item tap" style={{ margin: 0, cursor: "pointer" }}>
        <span className="avatar-sm">
          {p.av}
          {p.on && <span className="on" />}
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="t">{p.name}</div>
          <div className="s">
            {fmtPosition(p.role)} · {p.team}
          </div>
        </div>
        <span className="sp" />
        <MBadge t={tone(p.status)}>{p.status}</MBadge>
      </div>
    </SwipeRow>
  );

  const gallery = (p: RosterPerson) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span className="gal-av">
        {p.av}
        {p.on && <span className="on" />}
      </span>
      <div className="t" style={{ fontSize: 12.5, textAlign: "center", marginTop: 8 }}>
        {p.name}
      </div>
      <div className="s" style={{ fontSize: 10.5, textAlign: "center" }}>
        {fmtPosition(p.role)}
      </div>
      <MBadge t={tone(p.status)}>{p.status}</MBadge>
    </div>
  );

  return (
    <NormalizedList
      k="dr"
      items={people}
      fields={FIELDS}
      search={(p) => `${p.name} ${p.role} ${p.team}`}
      searchPlaceholder={labels.search}
      renderRow={row}
      gallery={gallery}
      views={["list", "gallery", "table"]}
      statusField="status"
      statusOrder={allStatuses}
      pill={{ get: (p) => p.team, order: allTeams }}
      empty={{ cols: ["Name", "Position", "Status"], title: labels.emptyTitle, hint: labels.emptyBody }}
    />
  );
}
