"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { ActionBar, Fab, KIcon } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Kit 30 · Project Roster list — client leaf. ActionBar search over the rows
 * the server page shapes; a `pill ico` cluster link to the reporting tree;
 * the sticky FAB routes to the Assign flow. Rows open the engagement's
 * contract screen.
 */

export type RosterRow = {
  id: string;
  name: string;
  initials: string;
  /** "VIP Manager · Oct 1 → Oct 20" — pre-composed server-side. */
  sub: string;
  /** "Docs 2/4" or "" — second sub-line. */
  docs: string;
  stateLabel: string;
  tone: string;
};

export function RosterList({ rows }: { rows: RosterRow[] }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.name} ${r.sub} ${r.stateLabel}`.toLowerCase().includes(q));
  }, [rows, query]);

  if (rows.length === 0) {
    return (
      <>
        <EmptyState
          icon={<UsersRound size={28} aria-hidden="true" />}
          title={t("m.roster.empty.title", undefined, "No One On This Roster Yet")}
          description={t(
            "m.roster.empty.body",
            undefined,
            "Assign people from the org directory with a role and contract dates.",
          )}
          action={
            <Link href="/m/roster/assign" className="ps-btn ps-btn--cta">
              {t("m.roster.empty.cta", undefined, "Assign Person")}
            </Link>
          }
        />
        <Fab href="/m/roster/assign" icon="UserRoundPlus" label={t("m.roster.fab", undefined, "Assign Person")} />
      </>
    );
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ActionBar
            k="roster"
            query={query}
            setQuery={setQuery}
            placeholder={t("m.roster.search", undefined, "Search Person, Role…")}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
        </div>
        <Link
          href="/m/roster/reporting"
          className="pill ico"
          aria-label={t("m.roster.reportingLink", undefined, "Reporting Structure")}
          style={{ marginBottom: 12 }}
        >
          <KIcon name="Network" size={16} />
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="s" style={{ color: "var(--p-text-3)", padding: "16px 4px" }}>
          {t("m.roster.noMatch", undefined, "Nothing matches your search.")}
        </div>
      ) : (
        visible.map((r) => (
          <Link key={r.id} href={`/m/roster/${r.id}/contract`} className="item tap" style={{ cursor: "pointer" }}>
            <span className="avatar-sm">{r.initials}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{r.name}</div>
              <div className="s">{r.sub}</div>
              {r.docs ? (
                <div className="s" style={{ marginTop: 2 }}>
                  {r.docs}
                </div>
              ) : null}
            </div>
            <span className={`ps-badge ps-badge--${r.tone}`} style={{ flex: "none" }}>
              {r.stateLabel}
            </span>
          </Link>
        ))
      )}

      <Fab href="/m/roster/assign" icon="UserRoundPlus" label={t("m.roster.fab", undefined, "Assign Person")} />
    </>
  );
}
