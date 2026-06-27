import "server-only";
import { env, hasResend } from "./env";
import { httpFetch } from "./http";
import { BRAND, PRODUCT_ACCENTS } from "./brand";
import { SITE } from "./seo";

/**
 * Resolve the absolute brand-asset URL — emails can't ship relative
 * paths because the recipient's mail client has no concept of our
 * origin. `SITE.baseUrl` carries the canonical apex fallback.
 */
function brandAssetUrl(path: string): string {
  const base = SITE.baseUrl.replace(/\/+$/, "");
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
  atlvs: { fill: PRODUCT_ACCENTS.atlvs, contrast: "#ffffff", icon: "/brand/atlvs-icon-atlvs.svg" },
  compvss: { fill: PRODUCT_ACCENTS.compvss, contrast: "#1f0d00", icon: "/brand/atlvs-icon-compvss.svg" },
  gvteway: { fill: PRODUCT_ACCENTS.gvteway, contrast: "#ffffff", icon: "/brand/atlvs-icon-gvteway.svg" },
};

/**
 * Optional producer co-brand for the email header (co-brand within shell):
 * the authoring org's mark/logo + accent lead, and the small ATLVS
 * endorsement is retained in the footer. Sender stays no-reply@atlvs.pro.
 */
export type EmailBrand = { producerName?: string; producerLogoUrl?: string | null; accent?: string };

export function wrapEmailHtml(bodyHtml: string, opts: { accent?: EmailWrapAccent; brand?: EmailBrand } = {}): string {
  const tile = ACCENT_TILE[opts.accent ?? "atlvs"];
  const accentFill = opts.brand?.accent ?? tile.fill;
  // Header logo: producer logo (already absolute) if provided, else the
  // platform product icon (relative → absolute via brandAssetUrl).
  const markUrl = opts.brand?.producerLogoUrl ?? brandAssetUrl(tile.icon);
  const wordmark = opts.brand?.producerName ?? BRAND.mark;
  const subline = opts.brand?.producerName ? "" : "Technologies";
  return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F7F8FA;font-family:'Hanken Grotesk','Helvetica Neue',Arial,sans-serif;color:#181B23">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F8FA;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E4E7EC;border-radius:12px;overflow:hidden">
        <!-- Header band — producer mark/logo (co-brand within shell) -->
        <tr><td style="padding:20px 24px;border-bottom:1px solid #E4E7EC;background:#FFFFFF">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:14px;vertical-align:middle"><img src="${markUrl}" width="36" height="36" alt="" style="display:block;border-radius:8px"/></td>
            <td style="vertical-align:middle">
              <div style="font-size:16px;font-weight:700;letter-spacing:0.04em;color:#181B23;text-transform:uppercase;line-height:1">${wordmark}</div>
              ${subline ? `<div style="font-family:'Space Mono','Courier New',monospace;font-size:10px;letter-spacing:0.12em;color:#8C95A3;text-transform:uppercase;margin-top:4px">${subline}</div>` : ""}
            </td>
          </tr></table>
        </td></tr>
        <!-- Body content -->
        <tr><td style="padding:28px 24px;background:#FFFFFF">${bodyHtml}</td></tr>
        <!-- Endorsement footer band — small "powered by ATLVS" -->
        <tr><td style="padding:18px 24px;border-top:1px solid #E4E7EC;background:#F7F8FA;font-family:'Space Mono','Courier New',monospace;font-size:11px;letter-spacing:0.1em;color:#8C95A3;text-transform:uppercase;text-align:center">
          Powered by <a href="${brandAssetUrl("/")}" style="color:${accentFill};text-decoration:none;font-weight:600">${BRAND.mark}</a>
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
      from: env.RESEND_FROM ?? `${BRAND.legalName} <${BRAND.emails.noReply}>`,
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

/**
 * Look up an org's active transactional template by slug and substitute
 * `{{merge_tag}}` placeholders. Returns null when no template is set so
 * callers fall back to the inline default. Body is wrapped in the brand
 * chrome by the caller (the stored body_html is the inner content).
 */
export async function renderOrgEmailTemplate(
  orgId: string,
  slug: string,
  vars: Record<string, string>,
): Promise<{ subject: string; bodyHtml: string } | null> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("email_templates")
      .select("subject, body_html")
      .eq("org_id", orgId)
      .eq("slug", slug)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data?.body_html) return null;
    const sub = (s: string) => s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k: string) => vars[k] ?? "");
    return { subject: sub(data.subject ?? slug), bodyHtml: sub(data.body_html) };
  } catch {
    return null;
  }
}

// Convenience: send a proposal share-link notification. When a producer
// `brand` is passed, the email co-brands (header mark/logo + accent button)
// and the from-name becomes the producer org; sender stays no-reply@atlvs.pro.
// When `orgId` is passed and the org has an active `proposal_sent` template,
// its subject + body (with merge tags) override the inline default.
export async function sendProposalShareEmail({
  to,
  proposalTitle,
  url,
  senderName,
  brand,
  orgId,
}: {
  to: string;
  proposalTitle: string;
  url: string;
  senderName?: string;
  brand?: EmailBrand;
  orgId?: string;
}) {
  const accent = brand?.accent ?? "#E23414";
  const onAccent = pickReadableForeground(accent);
  const fromName = brand?.producerName ?? senderName ?? BRAND.legalName;
  const sender = senderName ?? brand?.producerName ?? "The team";

  // Per-org template override (Opp #21), else the inline default body.
  const tpl = orgId
    ? await renderOrgEmailTemplate(orgId, "proposal_sent", {
        proposalTitle,
        url,
        senderName: sender,
        producerName: brand?.producerName ?? "",
        recipientEmail: to,
      })
    : null;

  const subject = tpl?.subject || `${fromName} sent you a proposal: ${proposalTitle}`;
  const bodyHtml =
    tpl?.bodyHtml ||
    `<p style="margin:0;color:#5b6472;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-family:'Space Mono','Courier New',monospace">Proposal</p>
       <h1 style="font-family:'Anton','Arial Narrow','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:400;margin:12px 0 8px;letter-spacing:0.005em;text-transform:uppercase;color:#181B23">${proposalTitle}</h1>
       <p style="color:#181b23;font-size:14px;margin:0 0 20px">${sender} shared a proposal with you.</p>
       <p style="margin:0 0 20px"><a href="${url}" style="display:inline-block;background:${accent};color:${onAccent};padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Open proposal</a></p>
       <p style="color:#8c95a3;font-size:12px;margin:0;font-family:'Space Mono','Courier New',monospace">If the button doesn't work, copy this URL:<br/><code style="word-break:break-all">${url}</code></p>`;

  return sendEmail({ to, subject, html: wrapEmailHtml(bodyHtml, { brand }) });
}

/** WCAG-ish contrast pick: black or white text on a hex accent. */
function pickReadableForeground(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) return "#ffffff";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  // Relative luminance (sRGB approximation).
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#181B23" : "#ffffff";
}
