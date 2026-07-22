"use client";

import { KIcon, RoseCard, QR } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";

export type CredentialEntry = {
  id: string;
  title: string;
  state: string;
  accessLevel: string | null;
  expiresOn: string | null;
};

export type SiteCapEntry = { label: string; icon: string };

type Labels = {
  accessTitle: string;
  credentialsTitle: string;
  capsEmpty: string;
  emptyTitle: string;
  emptyBody: string;
  help: string;
  gateBody: string;
  noCodeTitle: string;
  noCodeBody: string;
  /** "Expires" prefix for the credential expiry meta. */
  expires: string;
};

// Fulfillment-state → tone for the access list. Live/usable states read "ok".
const STATE_TONE: Record<string, string> = {
  issued: "ok",
  delivered: "ok",
  approved: "ok",
  transferred: "info",
  redeemed: "neutral",
  submitted: "warn",
  in_review: "warn",
  briefed: "neutral",
  draft: "neutral",
  expired: "danger",
  voided: "danger",
  rejected: "danger",
  returned: "neutral",
  revision_requested: "warn",
};
const titleCase = (s: string) =>
  s
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");

/**
 * The COMPVSS Rose wallet. Renders the holder's REAL active
 * `assignment_scan_codes` code as a genuine QR (on the Rose card's flip
 * side and as a large gate pass) — the exact string a gate scanner
 * resolves through the assignments domain. Honest model: no client-minted
 * "single-use" tokens, no fake rotation. When the holder has no active
 * code yet, the wallet says so instead of painting an unverifiable pass.
 */
export function RoseView({
  credentials,
  capabilities,
  holderName,
  activeCode,
  labels,
  stateLabels = {},
}: {
  credentials: CredentialEntry[];
  capabilities: SiteCapEntry[];
  holderName: string | null;
  activeCode: string | null;
  labels: Labels;
  /** Translated label per fulfillment state (titleCase fallback). */
  stateLabels?: Record<string, string>;
}) {
  const stateLabel = (s: string) => stateLabels[s] ?? titleCase(s);
  return (
    <>
      {/* Full Rose pass — flip-to-QR of the real active scan code. */}
      <RoseCard
        holderName={holderName}
        code={activeCode}
        credentialLabel={activeCode}
        noCodeLabel={labels.noCodeBody}
      />

      {/* Large gate pass: the holder's active scan code, verified against
          the live roster at scan time by /api/v1/scan. */}
      {activeCode ? (
        <div className="pass-qr" style={{ paddingTop: 4, textAlign: "center" }}>
          {/* No wrapper fill needed: the QR renders its own white field +
              quiet zone so it stays scannable in dark mode. */}
          <div style={{ display: "inline-flex", borderRadius: 14, overflow: "hidden" }}>
            <QR value={activeCode} size={176} />
          </div>
          <div className="pass-id">{activeCode}</div>
          <div className="hint" style={{ marginTop: 6 }}>
            {labels.gateBody}
          </div>
        </div>
      ) : (
        <EmptyState size="compact" title={labels.noCodeTitle} description={labels.noCodeBody} />
      )}

      {/* Real "what you're cleared to do" — the holder's granted field
          capabilities (see site-capabilities.ts). Replaces the prototype's
          hardcoded PASS_PERMS fiction. Cleared-only, never a denied list. */}
      <div className="sech">
        <h2>{labels.accessTitle}</h2>
        {capabilities.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--p-text-3)" }}>
            {capabilities.length}
          </span>
        )}
      </div>
      {capabilities.length === 0 ? (
        <div className="s" style={{ color: "var(--p-text-3)" }}>
          {labels.capsEmpty}
        </div>
      ) : (
        capabilities.map((c) => (
          <div className="item" key={c.label}>
            <span className="perm-ic">
              <KIcon name={c.icon} size={17} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div className="t">{c.label}</div>
            </div>
            <span className="sp" />
            <span className="ps-badge ps-badge--ok">
              <KIcon name="Check" size={11} />
            </span>
          </div>
        ))
      )}

      <div className="sech">
        <h2>{labels.credentialsTitle}</h2>
        {credentials.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--p-text-3)" }}>
            {credentials.length}
          </span>
        )}
      </div>

      {credentials.length === 0 ? (
        <EmptyState size="compact" title={labels.emptyTitle} description={labels.emptyBody} />
      ) : (
        credentials.map((c) => {
          const tone = STATE_TONE[c.state] ?? "neutral";
          const meta = [
            c.accessLevel,
            c.expiresOn ? `${labels.expires} ${c.expiresOn}` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <div className="item" key={c.id}>
              <span className="perm-ic">
                <KIcon name="IdCard" size={17} />
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="t">{c.title}</div>
                <div className="s">{meta || stateLabel(c.state)}</div>
              </div>
              <span className="sp" />
              <span className={`ps-badge ps-badge--${tone}`}>{stateLabel(c.state)}</span>
            </div>
          );
        })
      )}

      <a
        className="ps-btn ps-btn--secondary"
        href="/m/settings"
        style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
      >
        <KIcon name="LifeBuoy" size={15} /> {labels.help}
      </a>
    </>
  );
}
