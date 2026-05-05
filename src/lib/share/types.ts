/**
 * Shared types for the share_links primitive.
 *
 * One table, one HMAC token format, one public unauth route — backs every
 * "send me a public link" surface (saved views, dashboards, PDFs, proposals,
 * guides). See docs/research/smartsuite-parity/04-solutions-permissions-collab.md
 * recommendation #10.
 */

export type ShareLinkRole = "viewer" | "commenter";

/** Mirror of the `share_links` table shape. */
export type ShareLink = {
  id: string;
  org_id: string;
  resource_table: string;
  resource_id: string;
  role: ShareLinkRole;
  /** Truthy when a passcode is required. The actual hash is never returned to clients. */
  has_passcode: boolean;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  label: string | null;
  meta: Record<string, unknown>;
  revoked_at: string | null;
  revoked_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
};

/** Body shape for POST /api/v1/share-links. */
export type CreateShareLinkInput = {
  resourceTable: string;
  resourceId: string;
  expiresInDays?: number;
  passcode?: string;
  maxUses?: number;
  label?: string;
  role?: ShareLinkRole;
};

/** Response shape for POST /api/v1/share-links — id + the absolute share URL. */
export type CreateShareLinkResult = {
  id: string;
  url: string;
  link: ShareLink;
};

/** Reasons a share link consume can fail. */
export type ConsumeFailureReason =
  | "invalid"
  | "revoked"
  | "expired"
  | "exhausted"
  | "passcode_required"
  | "passcode_wrong";

export type ConsumeShareLinkResult =
  | {
      ok: true;
      link: ShareLink;
      resource: { table: string; id: string };
    }
  | { ok: false; reason: ConsumeFailureReason };
