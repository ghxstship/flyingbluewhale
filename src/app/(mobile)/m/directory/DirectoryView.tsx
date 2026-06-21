"use client";

import { useMemo, useState } from "react";
import { ActionBar, DataTable, GroupedList, SwipeRow } from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";

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
};

export function DirectoryView({ people, labels }: { people: RosterPerson[]; labels: Labels }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState("name");
  const [teams, setTeams] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const allTeams = useMemo(() => [...new Set(people.map((p) => p.team))], [people]);

  const items = useMemo(() => {
    return people
      .filter((p) => teams.size === 0 || teams.has(p.team))
      .filter(
        (p) =>
          !query ||
          (p.name + " " + p.role + " " + p.team).toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) =>
        sort === "role"
          ? a.role.localeCompare(b.role)
          : sort === "status"
            ? Number(b.on) - Number(a.on)
            : a.name.localeCompare(b.name),
      );
  }, [people, teams, query, sort]);

  const row = (p: RosterPerson) => (
    <SwipeRow
      key={p.id}
      onClick={() => {}}
      actions={[
        { icon: "MessageSquare", label: labels.message, tone: "info", on: () => {} },
        {
          icon: "Phone",
          label: labels.call,
          tone: "ok",
          on: () => {
            if (p.phone) window.location.href = `tel:${p.phone}`;
          },
        },
        {
          icon: "Mail",
          label: labels.email,
          tone: "info",
          on: () => {
            if (p.email) window.location.href = `mailto:${p.email}`;
          },
        },
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
            {p.role} · {p.team}
          </div>
        </div>
        <span className="sp" />
        <MBadge t={tone(p.status)}>{p.status}</MBadge>
      </div>
    </SwipeRow>
  );

  let groups: [string, RosterPerson[]][] | null = null;
  if (group === "team") {
    const mp: Record<string, RosterPerson[]> = {};
    items.forEach((p) => {
      (mp[p.team] = mp[p.team] || []).push(p);
    });
    groups = allTeams.filter((k) => mp[k]).map((k) => [k, mp[k]] as [string, RosterPerson[]]);
  }

  return (
    <>
      <ActionBar
        k="dr"
        query={query}
        setQuery={setQuery}
        placeholder={labels.search}
        view={view}
        setView={setView}
        views={["list", "gallery", "table"]}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", "None"],
          ["team", "Team"],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["name", "Name"],
          ["role", "Role"],
          ["status", "Status"],
        ]}
        filterActive={teams.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <>
            <div className="wl" style={{ marginBottom: 8 }}>
              Team
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
              {allTeams.map((tm) => (
                <button
                  type="button"
                  key={tm}
                  className={`chip ${teams.has(tm) ? "on" : ""}`}
                  onClick={() =>
                    setTeams((p) => {
                      const n = new Set(p);
                      n.has(tm) ? n.delete(tm) : n.add(tm);
                      return n;
                    })
                  }
                >
                  {tm}
                </button>
              ))}
            </div>
            <button type="button"
              className="pill"
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
              onClick={() => setTeams(new Set())}
            >
              Reset Filters
            </button>
          </>
        }
      />

      {view === "gallery" ? (
        <div className="gal-grid">
          {items.map((p) => (
            <div className="gal-card" key={p.id}>
              <span className="gal-av">
                {p.av}
                {p.on && <span className="on" />}
              </span>
              <div className="t" style={{ fontSize: 12.5, textAlign: "center", marginTop: 8 }}>
                {p.name}
              </div>
              <div className="s" style={{ fontSize: 10.5, textAlign: "center" }}>
                {p.role}
              </div>
              <MBadge t={tone(p.status)}>{p.status}</MBadge>
            </div>
          ))}
        </div>
      ) : view === "table" ? (
        <DataTable
          fields={[
            { id: "name", label: "Name", type: "text", get: (x: RosterPerson) => x.name },
            { id: "role", label: "Role", type: "text", get: (x: RosterPerson) => x.role },
            { id: "team", label: "Team", type: "text", get: (x: RosterPerson) => x.team },
            { id: "status", label: "Status", type: "text", get: (x: RosterPerson) => x.status },
          ]}
          items={items}
        />
      ) : groups ? (
        <GroupedList
          skey="ro"
          groups={groups}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          renderRow={(x) => row(x as RosterPerson)}
        />
      ) : (
        items.map(row)
      )}

      {!items.length && <EmptyState title={labels.emptyTitle} description={labels.emptyBody} />}
    </>
  );
}
