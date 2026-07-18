"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { publishOpenRole } from "../jobs/actions";

export type OpenRoleRow = {
  id: string;
  role: string;
  openings: number;
  filled: number;
  rate: string;
  /** roster_only | org_network | job_board */
  scope: string;
  published: boolean;
};

/**
 * Kit 31 (live-test resolution #18) — Open Roles on the Project Roster.
 * Roster-only openings carry a one-tap Publish that pushes them to the
 * public Job Board (per lifecycle.jsx: LC_OPENINGS + the Publish pill);
 * published ones show their scope badge.
 */
export function OpenRoles({ rows }: { rows: OpenRoleRow[] }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (rows.length === 0) return null;

  const publish = (id: string) => {
    if (pending) return;
    setBusy(id);
    setErr(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("jobId", id);
      const res = await publishOpenRole(null, fd);
      setBusy(null);
      if (res?.error) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  };

  const scopeLabel: Record<string, string> = {
    roster_only: t("m.roster.openRoles.rosterOnly", undefined, "Roster Only"),
    org_network: t("m.roster.openRoles.orgNetwork", undefined, "Org Network"),
    job_board: t("m.roster.openRoles.published", undefined, "Published"),
  };
  const scopeTone: Record<string, string> = {
    roster_only: "neutral",
    org_network: "info",
    job_board: "ok",
  };

  return (
    <>
      <div className="sech">
        <h2>{t("m.roster.openRoles.title", undefined, "Open Roles")}</h2>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--p-text-3)" }}>{rows.length}</span>
      </div>
      {err && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 8 }}>
          {err}
        </div>
      )}
      {rows.map((o) => (
        <div className="item" key={o.id}>
          <span className="more-ic">
            <KIcon name="Briefcase" size={17} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="t">{o.role}</div>
            <div className="s">
              {t(
                "m.roster.openRoles.filled",
                { filled: o.filled, openings: o.openings },
                `${o.filled}/${o.openings} Filled`,
              )}
              {o.rate ? ` · ${o.rate}` : ""}
            </div>
          </div>
          {o.scope === "roster_only" && !o.published ? (
            <button
              type="button"
              className="pill"
              disabled={pending}
              onClick={() => publish(o.id)}
              style={busy === o.id ? { opacity: 0.6 } : undefined}
            >
              <KIcon name="Send" size={13} />{" "}
              {busy === o.id
                ? t("m.roster.openRoles.publishing", undefined, "Publishing…")
                : t("m.roster.openRoles.publish", undefined, "Publish")}
            </button>
          ) : (
            <span className={`ps-badge ps-badge--${scopeTone[o.scope] ?? "neutral"}`}>
              {scopeLabel[o.scope] ?? o.scope}
            </span>
          )}
        </div>
      ))}
    </>
  );
}
