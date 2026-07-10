/**
 * ATLVS Email Kit — full-document layout shell.
 *
 * Composes the header/body/footer bands into a responsive, table-based
 * email document (max-width 600px, centered on the page canvas). Every
 * style is inline; see `blocks.ts` for why CSS variables can't be used.
 *
 * This is a *self-contained* string renderer — it does NOT call
 * `wrapEmailHtml` from `src/lib/email.ts`, because that module is
 * `import "server-only"` (it pulls the Resend sender + Supabase). Importing
 * it would make this kit unusable in any non-server context and couple a
 * pure presentation layer to the transport. Instead, this shell mirrors the
 * same chrome contract (header band → body → "Powered by ATLVS" footer) so
 * output is visually interchangeable with `wrapEmailHtml`. Callers that are
 * already in a server context may pass these template strings straight to
 * `sendEmail({ html })`.
 */

import {
  PALETTE,
  FONTS,
  emailHeader,
  emailFooter,
} from "./blocks";

export type EmailLayoutOptions = {
  /**
   * Hidden preview text shown by inboxes in the message-list snippet,
   * right after the subject. Kept off-screen in the rendered email.
   * Plain text — keep it under ~110 chars.
   */
  preheader: string;
  /** The composed inner HTML (built from block builders). */
  body: string;
  /** Absolute https logo URL for the header; omitted → wordmark fallback. */
  logoUrl?: string;
  /** Footer org name. Defaults to the ATLVS legal name. */
  orgName?: string;
  /** Optional footer postal address (CAN-SPAM friendly). */
  address?: string;
  /**
   * Absolute https URL for the recipient's notification preferences.
   * Pass for notification-class mail (activity fan-out) so the footer
   * carries a "manage notification emails" link; omit for strictly
   * transactional sends (verification, receipts, invites).
   */
  prefsUrl?: string;
};

/** Escape preheader text for the hidden preview span. */
function escapePreheader(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Wrap composed body HTML in the complete responsive email document.
 * Returns a full `<!doctype html>` string ready to hand to `sendEmail`.
 */
export function emailLayout({
  preheader,
  body,
  logoUrl,
  orgName = "ATLVS Technologies",
  address,
  prefsUrl,
}: EmailLayoutOptions): string {
  // The preheader trick: visible to inbox snippet, hidden in the body via
  // zero dimensions + matched colors, padded so it doesn't pull following
  // body copy into the snippet.
  const preview = `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${PALETTE.bg};opacity:0;">${escapePreheader(
    preheader,
  )}${"&#8203;&nbsp;".repeat(60)}</div>`;

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapePreheader(orgName)}</title>
  <!--[if mso]><style>table,td,div,p,a{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;width:100%;background:${PALETTE.bg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${preview}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PALETTE.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${PALETTE.surface};border:1px solid ${PALETTE.border};border-radius:14px;overflow:hidden;">
          ${emailHeader(logoUrl)}
          <tr>
            <td style="padding:32px 28px;background:${PALETTE.surface};font-family:${FONTS.body};color:${PALETTE.text};">
              ${body}
            </td>
          </tr>
          ${emailFooter(orgName, address, prefsUrl)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
