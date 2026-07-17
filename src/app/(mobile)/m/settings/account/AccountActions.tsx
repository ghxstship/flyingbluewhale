"use client";

import { useState, useTransition } from "react";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { pauseAccount, requestArchive, resumeAccount } from "./actions";

/**
 * Client leaf for the account lifecycle screen. Owns:
 *   • the Pause toggle (pause ↔ resume, reversible)
 *   • the Archive confirm flow (type ARCHIVE → request, irreversible by self)
 * All writes go through the server actions in ./actions.ts which re-check
 * `requireSession`. The server component passes the persisted initial state.
 */
export function AccountActions({
  initialPaused,
  initialArchiveRequested,
}: {
  initialPaused: boolean;
  initialArchiveRequested: boolean;
}) {
  const t = useT();
  const [paused, setPaused] = useState(initialPaused);
  const [archiveRequested, setArchiveRequested] = useState(initialArchiveRequested);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pausePending, startPause] = useTransition();
  const [archivePending, startArchive] = useTransition();

  const confirmed = confirmText.trim().toUpperCase() === "DELETE";

  return (
    <>
      {/* ── Pause Account ── */}
      <div className="sech">
        <h2>{t("m.account.pause.heading", undefined, "Pause Account")}</h2>
      </div>
      <p className="form-intro" style={{ marginBottom: 10 }}>
        {t(
          "m.account.pause.intro",
          undefined,
          "Stepping away for a bit? Pausing hides you from scheduling and rosters and mutes notifications. Your Rose, history and connections stay intact — reactivate anytime.",
        )}
      </p>
      <div className="item" style={{ display: "block" }}>
        {(
          [
            ["Eye", t("m.account.pause.hide", undefined, "Hidden from crew scheduling and rosters")],
            ["BellOff", t("m.account.pause.mute", undefined, "Notifications paused")],
            ["RotateCcw", t("m.account.pause.reverse", undefined, "Reactivate anytime — nothing is lost")],
          ] as const
        ).map(([icon, label]) => (
          <div
            key={label}
            style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0" }}
          >
            <KIcon name={icon} size={17} style={{ color: "var(--p-text-2)", flex: "none" }} />
            <span style={{ fontSize: 13.5 }}>{label}</span>
          </div>
        ))}
      </div>
      {paused ? (
        /* `ps-btn--secondary` is not a kit class (the bordered variant is
           `--ghost`) — the phantom modifier fell through to the filled base. */
        <button
          type="button"
          className="ps-btn ps-btn--ghost"
          disabled={pausePending}
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => {
            setError(null);
            startPause(async () => {
              const res = await resumeAccount();
              if (res?.error) setError(res.error);
              else setPaused(false);
            });
          }}
        >
          <KIcon name="RotateCcw" size={15} /> {t("m.account.pause.resume", undefined, "Resume My Account")}
        </button>
      ) : (
        <button
          type="button"
          className="ps-btn ps-btn--cta"
          disabled={pausePending}
          style={{
            width: "100%",
            justifyContent: "center",
            background: "var(--p-warning)",
            borderColor: "var(--p-warning)",
            color: "var(--p-warning-text)",
          }}
          onClick={() => {
            setError(null);
            startPause(async () => {
              const res = await pauseAccount();
              if (res?.error) setError(res.error);
              else setPaused(true);
            });
          }}
        >
          <KIcon name="PauseCircle" size={15} /> {t("m.account.pause.cta", undefined, "Pause My Account")}
        </button>
      )}
      {paused && (
        <div className="item" style={{ marginTop: 10 }}>
          <KIcon name="CircleCheck" size={16} style={{ color: "var(--p-warning)" }} />
          <div className="s" style={{ color: "var(--p-text-2)" }}>
            {t("m.account.pause.active", undefined, "Your account is paused. Resume above when you're ready.")}
          </div>
        </div>
      )}

      {/* ── Delete Account (destructive) — kit 29: the spec'd account-deletion
          entry (app-store requirement). Runs the shared archive contract:
          soft-delete + PII scrub + immediate access revoke, with a 30-day
          restore grace window. ── */}
      <div className="sech">
        <h2>{t("m.account.delete.heading", undefined, "Delete Account")}</h2>
      </div>
      <p className="form-intro" style={{ marginBottom: 10 }}>
        {t(
          "m.account.delete.intro",
          undefined,
          "Deletes your account: your profile is anonymized and all access is revoked immediately. You can restore it by signing back in within 30 days — after that it's permanent.",
        )}
      </p>
      <div
        className="item"
        style={{ display: "block", borderColor: "var(--p-info)" }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <KIcon name="Scale" size={16} style={{ color: "var(--p-info)", flex: "none", marginTop: 1 }} />
          <span style={{ fontSize: 13 }}>
            <strong>{t("m.account.archive.retainTitle", undefined, "Records are retained, not deleted.")}</strong>{" "}
            {t(
              "m.account.archive.retainBody",
              undefined,
              "Shifts, time logs, incident reports, approvals and asset chain-of-custody are kept for legal and compliance reasons. Your personal profile data is anonymized.",
            )}
          </span>
        </div>
      </div>
      <div className="item" style={{ display: "block" }}>
        {(
          [
            ["Download", t("m.account.archive.export", undefined, "Export your data first"), "success"],
            ["UserX", t("m.account.delete.revoke", undefined, "Access revoked immediately"), "warning"],
            ["FileLock2", t("m.account.archive.preserve", undefined, "Operational records preserved"), "info"],
          ] as const
        ).map(([icon, label, tone]) => (
          <div
            key={label}
            style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0" }}
          >
            <KIcon name={icon} size={17} style={{ color: `var(--p-${tone})`, flex: "none" }} />
            <span style={{ fontSize: 13.5 }}>{label}</span>
          </div>
        ))}
      </div>

      {archiveRequested ? (
        <div className="item">
          <KIcon name="CircleCheck" size={16} style={{ color: "var(--p-success)" }} />
          <div className="s" style={{ color: "var(--p-text-2)" }}>
            {t(
              "m.account.delete.requested",
              undefined,
              "Account deletion is in progress. Sign back in within 30 days to restore it.",
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="fld">
            <label>{t("m.account.delete.confirmLabel", undefined, "Type DELETE to confirm")}</label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <button
            type="button"
            className="ps-btn ps-btn--danger"
            disabled={!confirmed || archivePending}
            style={{ width: "100%", justifyContent: "center", opacity: confirmed ? 1 : 0.5 }}
            onClick={() => {
              setError(null);
              startArchive(async () => {
                const res = await requestArchive();
                if (res?.error) setError(res.error);
                else setArchiveRequested(true);
              });
            }}
          >
            <KIcon name="UserX" size={15} /> {t("m.account.delete.cta", undefined, "Delete My Account")}
          </button>
        </>
      )}

      {error && (
        <div className="item" style={{ marginTop: 10, borderColor: "var(--p-danger)" }}>
          <KIcon name="TriangleAlert" size={16} style={{ color: "var(--p-danger)" }} />
          <div className="s" style={{ color: "var(--p-danger)" }}>
            {error}
          </div>
        </div>
      )}
    </>
  );
}
