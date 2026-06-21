"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionBar, GroupedList, KIcon, TogRow } from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";

export type AdvanceRow = {
  id: string;
  title: string | null;
  catalogKind: string;
  fulfillmentState: string;
  deadline: string | null;
  project: string | null;
};

// Local label/tone maps — the canonical tuples live in the server-only
// `@/lib/db/assignments`, which can't be imported into a client component.
const KIND_LABEL: Record<string, string> = {
  ticket: "Ticket",
  credential: "Credential",
  catering: "Catering",
  radio: "Radio",
  tool: "Tool",
  equipment: "Equipment",
  uniform: "Uniform",
  travel: "Travel",
  lodging: "Lodging",
  vehicle: "Vehicle",
  labor: "Labor",
};

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

const STATE_TONE: Record<string, string> = {
  briefed: "neutral",
  draft: "neutral",
  submitted: "info",
  in_review: "info",
  revision_requested: "warn",
  approved: "ok",
  rejected: "danger",
  delivered: "ok",
  issued: "ok",
  transferred: "info",
  redeemed: "ok",
  expired: "neutral",
  voided: "danger",
  returned: "neutral",
};

function toneVar(tone: string | undefined): string {
  switch (tone) {
    case "ok":
      return "var(--p-success)";
    case "warn":
      return "var(--p-warning)";
    case "info":
      return "var(--p-info)";
    case "danger":
      return "var(--p-danger)";
    default:
      return "var(--p-border)";
  }
}

function stateLabel(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function AdvancesView({ rows }: { rows: AdvanceRow[] }) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [group, setGroup] = useState("kind");
  const [sort, setSort] = useState("deadline");
  const [kinds, setKinds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const kindList = useMemo(() => Array.from(new Set(rows.map((r) => r.catalogKind))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows
      .filter((r) => kinds.size === 0 || kinds.has(r.catalogKind))
      .filter(
        (r) =>
          !q ||
          ((r.title ?? "") + " " + KIND_LABEL[r.catalogKind] + " " + (r.project ?? "")).toLowerCase().includes(q),
      )
      .sort((a, b) =>
        sort === "kind"
          ? a.catalogKind.localeCompare(b.catalogKind)
          : sort === "title"
            ? (a.title ?? "").localeCompare(b.title ?? "")
            : (a.deadline ?? "~").localeCompare(b.deadline ?? "~"),
      );
  }, [rows, query, kinds, sort]);

  const toggleKind = (k: string) =>
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const row = (r: AdvanceRow) => (
    <div
      className="item tap"
      key={r.id}
      style={{ cursor: "pointer" }}
      onClick={() => router.push(`/m/advances/${r.id}`)}
    >
      <span className="bar" style={{ background: toneVar(STATE_TONE[r.fulfillmentState]) }} />
      <KIcon name={KIND_ICON[r.catalogKind] ?? "Package"} size={18} style={{ color: "var(--p-text-2)", flex: "none" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t">{r.title ?? KIND_LABEL[r.catalogKind] ?? r.catalogKind}</div>
        <div className="s">
          {KIND_LABEL[r.catalogKind] ?? r.catalogKind}
          {r.project ? ` · ${r.project}` : ""}
        </div>
      </div>
      <span className={`ps-badge ps-badge--${STATE_TONE[r.fulfillmentState] ?? "neutral"}`}>
        {stateLabel(r.fulfillmentState)}
      </span>
    </div>
  );

  return (
    <>
      <ActionBar
        k="adv"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.advances.search", undefined, "Search Advances…")}
        view={view}
        setView={setView}
        views={["list"]}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", t("m.advances.group.none", undefined, "None")],
          ["kind", t("m.advances.group.kind", undefined, "Type")],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["deadline", t("m.advances.sort.deadline", undefined, "Due")],
          ["kind", t("m.advances.sort.kind", undefined, "Type")],
          ["title", t("m.advances.sort.title", undefined, "Name")],
        ]}
        filterActive={kinds.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            {kindList.map((k) => (
              <TogRow key={k} label={KIND_LABEL[k] ?? k} on={kinds.has(k)} set={() => toggleKind(k)} />
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.advances.empty.title", undefined, "No Advances")}
          description={t("m.advances.empty.body", undefined, "Gear, credentials and services assigned to you appear here.")}
        />
      ) : group === "kind" ? (
        <GroupedList
          skey="adv"
          groups={kindList
            .filter((k) => filtered.some((r) => r.catalogKind === k))
            .map((k) => [KIND_LABEL[k] ?? k, filtered.filter((r) => r.catalogKind === k)])}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          renderRow={row}
        />
      ) : (
        filtered.map(row)
      )}
    </>
  );
}
