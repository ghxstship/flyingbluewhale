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
<html><head><meta charset="utf-8"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
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
  /**
   * Inbox-snippet preview text. When the html body doesn't already carry a
   * preheader (the email-kit `emailLayout` does), this is injected as a
   * hidden div right after <body> so the snippet isn't the first body line.
   */
  preheader?: string;
};

export type SendEmailResult = {
  ok: boolean;
  id?: string;
  error?: string;
  /** True when RESEND_API_KEY is absent and the send was skipped, not delivered. */
  skipped?: boolean;
};

/**
 * Derive a readable plain-text alternative from an HTML body. Multipart
 * text improves deliverability (spam filters distrust html-only mail) and
 * covers text-only clients. Best-effort tag stripping — good enough for
 * our table-based transactional markup, not a general HTML parser.
 */
export function htmlToText(html: string): string {
  return (
    html
      // Hidden preheader spans/divs (display:none) would duplicate into text.
      .replace(/<(div|span)[^>]*display\s*:\s*none[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, "")
      // Anchors → "label (url)" so CTAs survive the strip.
      .replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, label: string) => {
        const text = label.replace(/<[^>]+>/g, "").trim();
        return text && text !== href ? `${text} (${href})` : href;
      })
      .replace(/<(br|\/p|\/h[1-6]|\/tr|\/table|\/div)[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&#8203;/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/[ \t]+/g, " ")
      .replace(/\s*\n\s*/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/** Inject a hidden preheader div right after <body ...> (no-op if absent). */
function injectPreheader(html: string, preheader: string): string {
  const safe = preheader.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const div = `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;opacity:0;">${safe}${"&#8203;&nbsp;".repeat(40)}</div>`;
  const m = /<body[^>]*>/i.exec(html);
  if (!m) return html;
  const idx = m.index + m[0].length;
  return html.slice(0, idx) + div + html.slice(idx);
}

/**
 * Send a transactional email via Resend.
 *
 * When RESEND_API_KEY is absent (dev + preview-only deploys) the send is
 * SKIPPED — the result carries `{ ok: true, skipped: true }` and a server
 * warning is logged so operators can tell email is off (it is not silently
 * "delivered"). Callers may surface `skipped` to the user.
 *
 * A plain-text alternative is auto-derived from the html body when the
 * caller doesn't pass one (multipart best practice).
 */
export async function sendEmail(payload: EmailPayload): Promise<SendEmailResult> {
  if (!hasResend) {
    console.warn("[email skipped] RESEND_API_KEY not configured — not delivered:", payload.subject, payload.to);
    return { ok: true, skipped: true };
  }
  const html = payload.html && payload.preheader ? injectPreheader(payload.html, payload.preheader) : payload.html;
  const text = payload.text ?? (payload.html ? htmlToText(payload.html) : undefined);
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
      html,
      text,
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

// Convenience: send a proposal share-link notification, rendered through
// the ATLVS email kit (src/components/email). When a producer `brand` is
// passed, the email co-brands (header logo, footer org name, accent CTA);
// sender stays no-reply@atlvs.pro. When `orgId` is passed and the org has
// an active `proposal_sent` template, its subject + body (with merge tags)
// override the kit default — the stored body is the inner content, wrapped
// in the kit layout so it still gets the chrome + preheader.
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
  const { proposalShareEmail, emailLayout } = await import("@/components/email");
  const sender = senderName ?? brand?.producerName ?? "The team";
  const accent = brand?.accent;
  const onAccent = accent ? pickReadableForeground(accent) : undefined;

  // Per-org template override (Opp #21), else the kit default.
  const tpl = orgId
    ? await renderOrgEmailTemplate(orgId, "proposal_sent", {
        proposalTitle,
        url,
        senderName: sender,
        producerName: brand?.producerName ?? "",
        recipientEmail: to,
      })
    : null;

  const rendered = tpl
    ? {
        subject: tpl.subject,
        html: emailLayout({
          preheader: `${sender} shared "${proposalTitle}" with you.`,
          body: tpl.bodyHtml,
          orgName: brand?.producerName,
          logoUrl: brand?.producerLogoUrl ?? undefined,
        }),
      }
    : proposalShareEmail({
        proposalTitle,
        senderName: sender,
        url,
        orgName: brand?.producerName,
        logoUrl: brand?.producerLogoUrl ?? undefined,
        accent,
        onAccent,
      });

  return sendEmail({ to, subject: rendered.subject, html: rendered.html });
}

/**
 * E-06 — the off-platform channel. Emails an external holder (guest-ticket
 * recipients and other `assignment_external_holders` parties, who have no
 * account, no push, no inbox) when their assignment is issued or changes
 * state. Kit-rendered, transactional (no prefs link — the recipient has no
 * account to manage preferences with). Fire-and-forget friendly: never
 * throws, returns the send result.
 */
export async function sendExternalAssignmentEmail({
  to,
  holderName,
  assignmentTitle,
  kindLabel,
  stateLabel,
  projectName,
  orgName,
  detailLines,
  replyTo,
}: {
  to: string;
  holderName?: string | null;
  assignmentTitle: string;
  kindLabel: string;
  stateLabel: string;
  projectName?: string | null;
  orgName?: string | null;
  detailLines?: string[];
  replyTo?: string;
}): Promise<SendEmailResult> {
  try {
    const { externalAssignmentEmail } = await import("@/components/email");
    const rendered = externalAssignmentEmail({
      holderName: holderName ?? undefined,
      assignmentTitle,
      kindLabel,
      stateLabel,
      projectName: projectName ?? undefined,
      orgName: orgName ?? undefined,
      detailLines,
    });
    return await sendEmail({ to, subject: rendered.subject, html: rendered.html, replyTo });
  } catch (err) {
    console.warn("[email] external assignment email failed:", (err as Error).message);
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * F-03 / E-06 — per-kind notification email fan-out. Resolves recipient
 * addresses from `public.users`, renders the kit notification template
 * (with the notification-preferences footer link), and sends one email per
 * recipient. Callers are responsible for preference gating BEFORE calling
 * (each store gates on its own matrix); this helper only resolves + sends.
 * Never throws.
 */
export async function sendNotificationEmailToUsers({
  userIds,
  title,
  body,
  url,
  eyebrow,
  orgName,
}: {
  userIds: string[];
  title: string;
  body?: string | null;
  /** In-app path (e.g. "/m/advances" or "/studio/...") or absolute URL. */
  url?: string | null;
  eyebrow?: string;
  orgName?: string | null;
}): Promise<{ sent: number; skipped: number; failed: number }> {
  if (userIds.length === 0) return { sent: 0, skipped: 0, failed: 0 };
  try {
    const [{ notificationEmail }, { createServiceClient, isServiceClientAvailable }, { urlFor, resolveNotificationHref }] =
      await Promise.all([import("@/components/email"), import("@/lib/supabase/server"), import("@/lib/urls")]);
    if (!isServiceClientAvailable()) return { sent: 0, skipped: userIds.length, failed: 0 };
    const svc = createServiceClient();
    const { data: users } = await svc.from("users").select("id, email").in("id", userIds);
    const emails = (users ?? []).map((u) => u.email).filter((e): e is string => !!e);
    if (emails.length === 0) return { sent: 0, skipped: userIds.length, failed: 0 };

    // Deep links in notification payloads are in-app paths; resolve them to
    // an absolute URL on the shell that owns the path (shared resolver —
    // the /me inbox renderer uses the same helper).
    const ctaUrl = url ? resolveNotificationHref(url) : undefined;
    const prefsUrl = urlFor("personal", "/me/notifications");
    const rendered = notificationEmail({
      eyebrow,
      title,
      body: body ?? undefined,
      ctaUrl,
      orgName: orgName ?? undefined,
      prefsUrl,
    });
    const results = await Promise.allSettled(
      emails.map((to) => sendEmail({ to, subject: rendered.subject, html: rendered.html })),
    );
    let sent = 0;
    let skipped = 0;
    let failed = 0;
    for (const r of results) {
      if (r.status !== "fulfilled" || !r.value.ok) failed += 1;
      else if (r.value.skipped) skipped += 1;
      else sent += 1;
    }
    return { sent, skipped, failed };
  } catch (err) {
    console.warn("[email] notification email fan-out failed:", (err as Error).message);
    return { sent: 0, skipped: 0, failed: userIds.length };
  }
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
