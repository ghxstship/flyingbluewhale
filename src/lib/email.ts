import "server-only";
import { env, hasResend } from "./env";
import { httpFetch } from "./http";

/**
 * Resolve the absolute brand-asset URL — emails can't ship relative
 * paths because the recipient's mail client has no concept of our
 * origin. Falls back to atlvs.pro in prod.
 */
function brandAssetUrl(path: string): string {
  const base = (env.NEXT_PUBLIC_APP_URL || "https://atlvs.pro").replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : "/" + path}`;
}

/**
 * Wrap a transactional-email body in the ATLVS canonical chrome:
 *  - Header band — pink Waypoint app-icon + spaced ATLVS wordmark
 *  - Recipient body content (passed in)
 *  - Footer band — GHXSTSHIP endorsement + atlvs.pro link
 *
 * Per v4 logo-kit canon. Email clients (Gmail/Outlook/Apple) strip
 * <style>, ignore CSS variables, and apply varying default styles —
 * so this layout is hand-rolled inline-styled HTML with table-based
 * structure where it matters for layout stability. Hex colors are
 * inlined from the atlvs-product palette (PINK/INK/CANVAS/MUTED).
 *
 * `accent` lets a sender swap pink→amber (compvss) or pink→cyan
 * (gvteway) when the notification originates from those products.
 */
export type EmailWrapAccent = "atlvs" | "compvss" | "gvteway";

const ACCENT_TILE: Record<EmailWrapAccent, { fill: string; contrast: string; icon: string }> = {
  atlvs: { fill: "#FF2E88", contrast: "#FFFFFF", icon: "/brand/atlvs-icon-atlvs.svg" },
  compvss: { fill: "#E9A23B", contrast: "#1B1305", icon: "/brand/atlvs-icon-compvss.svg" },
  gvteway: { fill: "#12B5B5", contrast: "#FFFFFF", icon: "/brand/atlvs-icon-gvteway.svg" },
};

export function wrapEmailHtml(bodyHtml: string, opts: { accent?: EmailWrapAccent } = {}): string {
  const accent = ACCENT_TILE[opts.accent ?? "atlvs"];
  const markUrl = brandAssetUrl(accent.icon);
  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:'Space Grotesk','Helvetica Neue',Arial,sans-serif;color:#181B23">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E4E7EC;border-radius:12px;overflow:hidden">
        <!-- Header band — Waypoint app-icon + wordmark -->
        <tr><td style="padding:20px 24px;border-bottom:1px solid #E4E7EC;background:#FFFFFF">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:14px;vertical-align:middle"><img src="${markUrl}" width="36" height="36" alt="" style="display:block;border-radius:8px"/></td>
            <td style="vertical-align:middle">
              <div style="font-size:16px;font-weight:700;letter-spacing:0.04em;color:#181B23;text-transform:uppercase;line-height:1">A T L V S</div>
              <div style="font-family:'Space Mono','Courier New',monospace;font-size:10px;letter-spacing:0.12em;color:#8C95A3;text-transform:uppercase;margin-top:4px">Technologies</div>
            </td>
          </tr></table>
        </td></tr>
        <!-- Body content -->
        <tr><td style="padding:28px 24px;background:#FFFFFF">${bodyHtml}</td></tr>
        <!-- Endorsement footer band — GHXSTSHIP parent -->
        <tr><td style="padding:18px 24px;border-top:1px solid #E4E7EC;background:#F7F8FA;font-family:'Space Mono','Courier New',monospace;font-size:11px;letter-spacing:0.1em;color:#8C95A3;text-transform:uppercase;text-align:center">
          a G H X S T S H I P Industries company · <a href="${brandAssetUrl("/")}" style="color:${accent.fill};text-decoration:none;font-weight:600">atlvs.pro</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Attachments. Resend accepts either:
 *   - { filename, content: base64 }   — up to ~10 MiB encoded
 *   - { filename, path: <https url> } — fetched by Resend before send
 * We accept both shapes; Buffer content is base64-encoded inline.
 */
export type EmailAttachment =
  | { filename: string; content: Buffer; contentType?: string }
  | { filename: string; path: string; contentType?: string };

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
};

/**
 * Send a transactional email via Resend. No-op when RESEND_API_KEY is absent
 * (dev + preview-only deploys). Swap for a queue-backed sender once volume warrants.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!hasResend) {
    console.info("[email noop]", payload.subject, payload.to);
    return { ok: true };
  }
  const res = await httpFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM ?? "ATLVS Technologies <no-reply@atlvs.pro>",
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: payload.replyTo,
      attachments: payload.attachments?.map((a) =>
        "content" in a
          ? { filename: a.filename, content: a.content.toString("base64"), content_type: a.contentType }
          : { filename: a.filename, path: a.path, content_type: a.contentType },
      ),
    }),
    timeoutMs: 8000,
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `resend ${res.status}: ${body}` };
  }
  const data = (await res.json()) as { id?: string };
  return { ok: true, id: data.id };
}

// Convenience: send a proposal share-link notification.
export async function sendProposalShareEmail({
  to,
  proposalTitle,
  url,
  senderName,
}: {
  to: string;
  proposalTitle: string;
  url: string;
  senderName?: string;
}) {
  return sendEmail({
    to,
    subject: `${senderName ?? "ATLVS Technologies"} sent you a proposal: ${proposalTitle}`,
    html: wrapEmailHtml(
      `<p style="margin:0;color:#5b6472;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-family:'Space Mono','Courier New',monospace">Proposal</p>
       <h1 style="font-family:'Space Grotesk','Helvetica Neue',Arial,sans-serif;font-size:30px;font-weight:700;margin:12px 0 8px;letter-spacing:-0.01em;color:#181B23">${proposalTitle}</h1>
       <p style="color:#181b23;font-size:14px;margin:0 0 20px">${senderName ?? "The team"} shared a proposal with you.</p>
       <p style="margin:0 0 20px"><a href="${url}" style="display:inline-block;background:#FF2E88;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Open proposal</a></p>
       <p style="color:#8c95a3;font-size:12px;margin:0;font-family:'Space Mono','Courier New',monospace">If the button doesn't work, copy this URL:<br/><code style="word-break:break-all">${url}</code></p>`,
    ),
  });
}
