import { urlFor } from "@/lib/urls";
import type { OfferLetterResolved } from "./types";
import { formatDateRange, formatDollars } from "./format";
import { formatDateParts } from "@/lib/i18n/format";
import { EMPLOYER_LABEL } from "./types";
import { DEFAULT_SIGNING_AUTHORITY_NAME, DEFAULT_SIGNING_AUTHORITY_TITLE } from "./signing";

export type ComposedEmail = {
  to: string;
  subject: string;
  plaintext: string;
  html: string;
  mailto: string;
};

// The offer flow + guide both live at the apex origin. `urlFor("marketing", …)`
// resolves to the apex (marketing has no subdomain) in both subdomain and
// path-prefix modes, so it's the single switch for these absolute links.
function letterUrl(token: string): string {
  return urlFor("marketing", `/offer/${token}`);
}

function guideUrl(letter: OfferLetterResolved): string | null {
  if (!letter.guide_url) return null;
  return letter.guide_url.startsWith("http") ? letter.guide_url : urlFor("marketing", letter.guide_url);
}

function compLine(letter: OfferLetterResolved): string {
  if (letter.compensation_basis === "tbd" || letter.effective_compensation_cents === 0) {
    return "Compensation: To be confirmed prior to signature.";
  }
  if (letter.compensation_basis === "flat_fee") {
    return `Compensation: ${formatDollars(letter.effective_compensation_cents)} flat project fee (milestone schedule in §5).`;
  }
  if (letter.compensation_basis === "per_day" && letter.rate_unit_price_cents) {
    return `Compensation: ${formatDollars(letter.rate_unit_price_cents)} per documented service-day deliverable (each day a discrete deliverable per §5).`;
  }
  if (letter.compensation_basis === "per_show_day" && letter.rate_unit_price_cents) {
    return `Compensation: ${formatDollars(letter.rate_unit_price_cents)} per documented show-day deliverable.`;
  }
  return `Compensation: ${formatDollars(letter.effective_compensation_cents)} per scope deliverable.`;
}

/**
 * Per-recipient offer-letter email. Returns subject, plaintext body, HTML body,
 * and a mailto: URL pre-filled with subject + plaintext body (so the admin can
 * click straight into their mail client). No automatic send — Julian reviews
 * and dispatches each one.
 */
/** Optional MSA-on-file state — when provided, the email softens the
 *  "Sign your MSA" call-out to a quiet reference line. */
export type MsaContext = {
  signed: boolean;
  signerUrl: string | null;
  signedAt: string | null;
  version: number | null;
};

export function composeOfferLetterEmail(letter: OfferLetterResolved, msa: MsaContext | null = null): ComposedEmail {
  const firstName = letter.recipient_name.split(/\s+/)[0] ?? letter.recipient_name;
  const url = letterUrl(letter.public_token);
  const code = letter.access_code;
  const guide = guideUrl(letter);
  const window = engagementWindowSummary(letter);
  const signer = letter.signing_authority_name ?? DEFAULT_SIGNING_AUTHORITY_NAME;
  const signerTitle = letter.signing_authority_title ?? DEFAULT_SIGNING_AUTHORITY_TITLE;
  const employerName = EMPLOYER_LABEL[letter.employer];
  const venueLine = [letter.venue_name, letter.venue_city, letter.venue_region].filter(Boolean).join(", ");

  // Subject template: <project code> | <activation name> | G H X S T S H I P | Engagement Letter - <Full Name>
  // project_name is "<CODE> <Activation Name…>" — split on the first whitespace.
  const firstSpace = letter.project_name.indexOf(" ");
  const projectCode = firstSpace > 0 ? letter.project_name.slice(0, firstSpace) : letter.project_name;
  const activationName = firstSpace > 0 ? letter.project_name.slice(firstSpace + 1).trim() : letter.project_name;
  const subject = `${projectCode} | ${activationName} | G H X S T S H I P | Engagement Letter - ${letter.recipient_name}`;

  const plaintext = `Greetings ${firstName},

YOU'RE ON THE MANIFEST! ${employerName} is bringing you on as ${letter.role_title} for ${letter.project_name}.

Here's the deal at a glance:
• Role: ${letter.role_title}${letter.role_department ? ` · ${letter.role_department}` : ""}
• On site: ${window.onsite}${window.travel ? ` · Travel ${window.travel}` : ""} · ${letter.engagement_days} working day${letter.engagement_days === 1 ? "" : "s"}
• Where: ${venueLine || "TBD"}
• ${compLine(letter)}
• Payment: ${letter.effective_payment_schedule}${window.travelLodgingLine ? `\n• ${window.travelLodgingLine}` : ""}

Sign in two clicks:
1) Open your letter: ${url}
2) Enter access code: ${code}
3) Read the schedule, terms, and onboarding — then type your full legal name to accept (or decline with a brief reason).

Once you sign, please complete the onboarding checklist within 48 hours so credentials can ship:
${(() => {
  const items = (letter.effective_onboarding_items ?? []).slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const lines: string[] = [];
  // First-timers get a star-step pointing at the MSA before everything else.
  if (msa && !msa.signed && msa.signerUrl) {
    lines.push(`★ Sign your Master Services Agreement (one-time, covers every future engagement) — ${msa.signerUrl}`);
  }
  for (const i of items) {
    lines.push(
      `${i.order}. ${i.label}${i.link ? ` — ${i.link}` : ""}${i.links ? i.links.map((l) => ` — ${l.label}: ${l.url}`).join("") : ""}${i.note ? `\n   (${i.note})` : ""}`,
    );
  }
  if (guide) {
    const nextOrder = (items[items.length - 1]?.order ?? items.length) + 1;
    lines.push(`${nextOrder}. Review the Salvage City Production Guide — ${guide}`);
  }
  return lines.join("\n");
})()}

This engagement is subject to our Independent Contractor Master Services Agreement.${msa && msa.signed && msa.signedAt ? ` Your signed MSA is on file (v${msa.version ?? 1}, ${formatShortDate(msa.signedAt)}).` : msa && msa.signerUrl ? ` Read & sign your copy here — ${msa.signerUrl}` : ""}

If you have any questions or concerns, just hit reply — I'll get back to you within 4 business hours.

Sea ya soon,
${signer}
${signerTitle}
${employerName}
${letter.signing_authority_email ?? "julian.clarkson@ghxstship.pro"}
`;

  const html = renderHtml({
    firstName,
    employerName,
    role: letter.role_title,
    project: letter.project_name,
    department: letter.role_department,
    onsiteWindow: window.onsite,
    travelWindow: window.travel,
    days: letter.engagement_days,
    venue: venueLine,
    comp: compLine(letter),
    payment: letter.effective_payment_schedule,
    travelLodgingLine: window.travelLodgingLine,
    url,
    code,
    guide,
    onboarding: (letter.effective_onboarding_items ?? []).slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
    msa,
    signer,
    signerTitle,
    signerEmail: letter.signing_authority_email ?? "julian.clarkson@ghxstship.pro",
  });

  const mailto = `mailto:${encodeURIComponent(letter.recipient_email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plaintext)}`;

  return { to: letter.recipient_email, subject, plaintext, html, mailto };
}

type HtmlArgs = {
  firstName: string;
  employerName: string;
  role: string;
  project: string;
  department: string | null;
  onsiteWindow: string;
  travelWindow: string | null;
  days: number;
  venue: string;
  comp: string;
  payment: string;
  travelLodgingLine: string | null;
  url: string;
  code: string;
  guide: string | null;
  onboarding: Array<{ order: number; label: string; required: boolean; link?: string }>;
  msa: MsaContext | null;
  signer: string;
  signerTitle: string;
  signerEmail: string;
};

function renderHtml(a: HtmlArgs): string {
  type Item = {
    order: number;
    label: string;
    required?: boolean;
    link?: string;
    links?: { label: string; url: string }[];
    note?: string;
  };
  const items: Item[] = a.onboarding.slice();
  if (a.guide) {
    const nextOrder = (items[items.length - 1]?.order ?? items.length) + 1;
    items.push({ order: nextOrder, label: "Review the Salvage City Production Guide", link: a.guide, required: true });
  }
  // First-timers get a prominent ★ MSA step at the top of the onboarding list.
  const msaStepHtml =
    a.msa && !a.msa.signed && a.msa.signerUrl
      ? `<li style="margin-bottom:12px;background:#fffaf0;border:1px solid #f2c94c;border-radius:6px;padding:10px 12px"><strong>★ Sign your Master Services Agreement</strong> <a href="${a.msa.signerUrl}" style="color:#3b6cff">Open MSA ↗</a><div style="font-size:12px;color:#666;margin-top:4px">One-time. Applies to every future engagement we book you on — you won&rsquo;t see this step again.</div></li>`
      : "";
  const onboardingHtml = items
    .map((i) => {
      const linkBadges =
        (i.links?.length ?? 0) > 0
          ? i
              .links!.map((l) => ` &middot; <a href="${l.url}" style="color:#3b6cff">${escapeHtml(l.label)} ↗</a>`)
              .join("")
          : i.link
            ? ` &middot; <a href="${i.link}" style="color:#3b6cff">open ↗</a>`
            : "";
      const noteLine = i.note
        ? `<div style="font-size:12px;color:#888;margin-top:2px;margin-left:18px">${escapeHtml(i.note)}</div>`
        : "";
      return `<li style="margin-bottom:8px"><strong>${i.order}.</strong> ${escapeHtml(i.label)}${linkBadges}${noteLine}</li>`;
    })
    .join("");

  const windowCell = a.travelWindow
    ? `${escapeHtml(a.onsiteWindow)} <span style="color:#888">&middot; Travel ${escapeHtml(a.travelWindow)}</span>`
    : escapeHtml(a.onsiteWindow);

  return `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;line-height:1.55;max-width:640px;margin:0 auto;padding:24px">
  <div style="text-transform:uppercase;letter-spacing:0.18em;font-size:11px;color:#888;font-family:'Space Mono','Courier New',monospace">${escapeHtml(a.employerName)}</div>
  <h1 style="font-size:22px;margin:8px 0 4px 0">YOU&rsquo;RE ON THE MANIFEST!</h1>
  <div style="color:#888;font-size:14px;margin-bottom:24px">${escapeHtml(a.project)}</div>

  <p>Greetings <strong>${escapeHtml(a.firstName)}</strong>,</p>
  <p>${escapeHtml(a.employerName)} is bringing you on as <strong>${escapeHtml(a.role)}</strong> for <strong>${escapeHtml(a.project)}</strong>. The deal at a glance &mdash; full letter behind the link below.</p>

  <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px">
    <tr><td style="padding:6px 0;color:#888;width:40%">Role</td><td style="padding:6px 0">${escapeHtml(a.role)}${a.department ? ` <span style="color:#888">&middot; ${escapeHtml(a.department)}</span>` : ""}</td></tr>
    <tr><td style="padding:6px 0;color:#888">On site</td><td style="padding:6px 0">${windowCell} <span style="color:#888">&middot; ${a.days} working day${a.days === 1 ? "" : "s"}</span></td></tr>
    <tr><td style="padding:6px 0;color:#888">Where</td><td style="padding:6px 0">${escapeHtml(a.venue || "TBD")}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Compensation</td><td style="padding:6px 0">${escapeHtml(a.comp)}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Payment</td><td style="padding:6px 0">${escapeHtml(a.payment)}</td></tr>
    ${a.travelLodgingLine ? `<tr><td style="padding:6px 0;color:#888">Travel + lodging</td><td style="padding:6px 0">${escapeHtml(a.travelLodgingLine)}</td></tr>` : ""}
  </table>

  <div style="background:#f7f7f5;border:1px solid #e6e6e0;border-radius:8px;padding:18px 20px;margin:24px 0">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:#888;margin-bottom:8px">Sign In Two Clicks</div>
    <div style="margin-bottom:10px"><a href="${a.url}" style="color:#3b6cff;text-decoration:none;font-weight:600">${a.url}</a></div>
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:#888;margin-bottom:6px">Access code</div>
    <div style="font-family:'Space Mono','Courier New',monospace;font-size:22px;letter-spacing:0.4em;background:#fff;border:1px solid #e6e6e0;border-radius:6px;padding:8px 14px;display:inline-block">${a.code}</div>
    <p style="margin:14px 0 0;font-size:12px;color:#666">Type your full legal name to accept &mdash; or decline with a brief reason. Signature, IP, and timestamp recorded as the audit trail.</p>
  </div>

  <h3 style="font-size:13px;text-transform:uppercase;letter-spacing:0.12em;color:#444;margin:24px 0 8px">After you sign &mdash; please complete within 48 hours</h3>
  <ol style="padding-left:0;list-style:none;font-size:13px">${msaStepHtml}${onboardingHtml}</ol>

  <p style="margin-top:28px">If you have any questions or concerns, just hit reply &mdash; I&rsquo;ll get back to you within 4 business hours.</p>

  <p style="margin-top:24px">Sea ya soon,<br/>
  <strong>${escapeHtml(a.signer)}</strong><br/>
  <span style="color:#888;font-size:12px">${escapeHtml(a.signerTitle)} &middot; ${escapeHtml(a.employerName)}</span><br/>
  <span style="color:#888;font-size:12px">${escapeHtml(a.signerEmail)}</span></p>

  <p style="margin-top:32px;padding-top:16px;border-top:1px solid #e6e6e0;color:#888;font-size:11px;line-height:1.5">
    This engagement is subject to our <strong>Independent Contractor Master Services Agreement</strong>.${
      a.msa && a.msa.signed && a.msa.signedAt
        ? ` Your signed MSA is on file (v${a.msa.version ?? 1}, ${escapeHtml(formatShortDate(a.msa.signedAt))}).`
        : a.msa && a.msa.signerUrl
          ? ` <a href="${a.msa.signerUrl}" style="color:#3b6cff">Read &amp; sign your copy here ↗</a> (one-time, applies to every future engagement).`
          : ""
    }<br/>
    Governing law: State of Nevada. Venue: Clark County, NV. Confidential and proprietary to ${escapeHtml(a.employerName)}.
  </p>
</body></html>`;
}

function formatShortDate(iso: string): string {
  const formatted = formatDateParts(iso, { month: "short", day: "numeric", year: "numeric" });
  return formatted === "—" ? iso : formatted;
}

function engagementWindowSummary(letter: OfferLetterResolved): {
  onsite: string;
  travel: string | null;
  travelLodgingLine: string | null;
} {
  const onsite =
    letter.effective_onsite_start && letter.effective_onsite_end
      ? formatDateRange(letter.effective_onsite_start, letter.effective_onsite_end)
      : "TBD (remote)";
  const travel =
    letter.travel_in_date && letter.travel_out_date
      ? formatDateRange(letter.travel_in_date, letter.travel_out_date)
      : null;
  const t = letter.effective_travel_provided;
  const l = letter.effective_lodging_provided;
  const m = letter.effective_meals_provided;
  const inc = [t && "Travel", l && "Lodging", m && "Meals"].filter(Boolean).join(" + ");
  return { onsite, travel, travelLodgingLine: inc ? `${inc} provided / arranged by GHXSTSHIP logistics` : null };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
