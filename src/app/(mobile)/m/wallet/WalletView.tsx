"use client";

import { KIcon, RoseCard, RotatingQR } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { mintGateToken } from "./actions";

export type CredentialEntry = {
  id: string;
  title: string;
  state: string;
  accessLevel: string | null;
  expiresOn: string | null;
};

type Labels = {
  accessTitle: string;
  emptyTitle: string;
  emptyBody: string;
  help: string;
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

export function WalletView({
  credentials,
  passBase,
  labels,
}: {
  credentials: CredentialEntry[];
  passBase: string;
  labels: Labels;
}) {
  return (
    <>
      {/* Full Rose pass — flip-to-QR (kit RoseCard). */}
      <RoseCard />

      {/* Live, single-use rotating gate token seeded from the viewer's active
          scan code. The token is minted server-side (HMAC, 30s window, keyed by
          a server-only secret) so it's gate-attestable, not a client random. */}
      <div className="pass-qr" style={{ paddingTop: 4 }}>
        <RotatingQR base={passBase} mintToken={mintGateToken} />
      </div>

      <div className="sech">
        <h2>{labels.accessTitle}</h2>
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
            c.expiresOn ? `Expires ${c.expiresOn}` : null,
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
                <div className="s">{meta || titleCase(c.state)}</div>
              </div>
              <span className="sp" />
              <span className={`ps-badge ps-badge--${tone}`}>{titleCase(c.state)}</span>
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
