/**
 * ATLVS Email Kit — ready-to-send templates.
 *
 * Each function returns a complete `<!doctype html>` document (via
 * `emailLayout`) plus a matching subject line. Voice is the ATLVS
 * world-builder register: confident, warm in the invitations, calm in
 * the chrome (see docs/brand/voice.md). No emoji, no competitor names.
 *
 * Pure string builders — safe to call anywhere (no server-only deps).
 * All caller-supplied *text* is escaped by the underlying block builders;
 * URLs and the announcement `body` are treated as trusted HTML.
 */

import {
  emailButton,
  emailHeading,
  emailText,
  emailEyebrow,
  emailDivider,
  emailSpacer,
  emailCodePanel,
  escapeHtml,
  PALETTE,
  FONTS,
} from "./blocks";
import { emailLayout } from "./layout";

export type RenderedEmail = { subject: string; html: string };

/** Small helper: the muted "fallback link" line under a CTA button. */
function fallbackUrlLine(url: string): string {
  return `<p style="margin:16px 0 0;font-family:${FONTS.mono};font-size:11px;line-height:1.5;color:${PALETTE.tertiary};">Button not working? Paste this into your browser:<br /><a href="${url}" target="_blank" rel="noopener" style="color:${PALETTE.accent};text-decoration:none;word-break:break-all;">${escapeHtml(
    url,
  )}</a></p>`;
}

/**
 * Welcome — sent right after signup. Sets the world-builder tone and points
 * the new operator at their first run.
 */
export function welcomeEmail({
  name,
  ctaUrl,
}: {
  name: string;
  ctaUrl: string;
}): RenderedEmail {
  const body = [
    emailEyebrow("Welcome aboard"),
    emailHeading(`You're in, ${name}.`, 1),
    emailText(
      "You didn't just sign up for software — you got the keys to a world. ATLVS runs the whole production: the deals, the people, the build, the show. Everything in one place, everyone on the same page.",
    ),
    emailText("Let's stand up your first project."),
    emailSpacer(8),
    emailButton({ label: "Open your console", href: ctaUrl }),
    fallbackUrlLine(ctaUrl),
  ].join("");

  return {
    subject: `Welcome to ATLVS, ${name}`,
    html: emailLayout({
      preheader: "Your console is ready — let's build something.",
      body,
    }),
  };
}

/**
 * Verify — one-time code + a magic verify link. Transactional, terse.
 */
export function verifyEmail({
  code,
  verifyUrl,
}: {
  code: string;
  verifyUrl: string;
}): RenderedEmail {
  const body = [
    emailEyebrow("Verify your email"),
    emailHeading("One step to go", 1),
    emailText("Enter this code to confirm your address:"),
    emailCodePanel(code, true),
    emailText("Or tap the button and we'll do it for you."),
    emailSpacer(4),
    emailButton({ label: "Verify email", href: verifyUrl }),
    fallbackUrlLine(verifyUrl),
    emailDivider(),
    emailText(
      `<span style="color:${PALETTE.tertiary};font-size:13px;">This code expires in 15 minutes. If you didn't request it, you can safely ignore this email.</span>`,
    ),
  ].join("");

  return {
    subject: `Your ATLVS verification code: ${code}`,
    html: emailLayout({
      preheader: `Your verification code is ${code}.`,
      body,
    }),
  };
}

/**
 * Invite — an operator invites someone into their org. Warm, gives the
 * inviter + org context, single accept CTA.
 */
export function inviteEmail({
  inviter,
  orgName,
  acceptUrl,
}: {
  inviter: string;
  orgName: string;
  acceptUrl: string;
}): RenderedEmail {
  const body = [
    emailEyebrow("You're invited"),
    emailHeading(`Join ${orgName}`, 1),
    emailText(
      `<strong style="color:${PALETTE.text};">${escapeHtml(
        inviter,
      )}</strong> wants you on the crew at <strong style="color:${PALETTE.text};">${escapeHtml(
        orgName,
      )}</strong>. Accept the invite and you'll land right where the work is happening.`,
    ),
    emailSpacer(8),
    emailButton({ label: "Accept invitation", href: acceptUrl }),
    fallbackUrlLine(acceptUrl),
    emailDivider(),
    emailText(
      `<span style="color:${PALETTE.tertiary};font-size:13px;">This invitation was sent to you by ${escapeHtml(
        inviter,
      )}. If you weren't expecting it, no action is needed.</span>`,
    ),
  ].join("");

  return {
    subject: `${inviter} invited you to ${orgName} on ATLVS`,
    html: emailLayout({
      preheader: `${inviter} invited you to join ${orgName}.`,
      body,
      orgName,
    }),
  };
}

/**
 * Announcement — campaign-style broadcast. `body` is trusted HTML (the
 * author writes rich copy); title + CTA are simple strings.
 */
export function announcementEmail({
  title,
  body,
  ctaLabel,
  ctaUrl,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): RenderedEmail {
  const content = [
    emailEyebrow("Announcement"),
    emailHeading(title, 1),
    emailText(body),
    emailSpacer(8),
    emailButton({ label: ctaLabel, href: ctaUrl }),
    fallbackUrlLine(ctaUrl),
  ].join("");

  return {
    subject: title,
    html: emailLayout({
      preheader: title,
      body: content,
    }),
  };
}

/**
 * Notification — the generic activity email behind the per-kind email
 * channel of the notification matrix (assignment issued, inquiry received,
 * invoice paid, ...). `title` + `body` are plain text (escaped); the footer
 * carries the notification-preferences link so recipients tune delivery
 * instead of reporting spam.
 */
export function notificationEmail({
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaUrl,
  orgName,
  prefsUrl,
}: {
  /** Small overline naming the event class, e.g. "Assignment". */
  eyebrow?: string;
  title: string;
  body?: string;
  ctaLabel?: string;
  /** Absolute https deep link to the record. Omit for FYI-only mail. */
  ctaUrl?: string;
  orgName?: string;
  /** Absolute https notification-preferences URL for the footer. */
  prefsUrl?: string;
}): RenderedEmail {
  const parts = [
    emailEyebrow(eyebrow ?? "Notification"),
    emailHeading(title, 2),
  ];
  if (body) parts.push(emailText(escapeHtml(body)));
  if (ctaUrl) {
    parts.push(
      emailSpacer(8),
      emailButton({ label: ctaLabel ?? "Open in ATLVS", href: ctaUrl }),
      fallbackUrlLine(ctaUrl),
    );
  }
  return {
    subject: title,
    html: emailLayout({
      preheader: body ? body.slice(0, 110) : title.slice(0, 110),
      body: parts.join(""),
      orgName,
      prefsUrl,
    }),
  };
}

/**
 * Proposal share — a producer sends a proposal link to a recipient.
 * Optionally co-branded: producer name in the header/footer, producer
 * logo, and a producer-accent CTA. Strictly transactional (no prefs link).
 */
export function proposalShareEmail({
  proposalTitle,
  senderName,
  url,
  orgName,
  logoUrl,
  accent,
  onAccent,
}: {
  proposalTitle: string;
  /** Person or org the recipient will recognize as the sender. */
  senderName: string;
  url: string;
  orgName?: string;
  /** Absolute https producer logo for the header band. */
  logoUrl?: string;
  /** Producer accent hex for the CTA fill. */
  accent?: string;
  /** Foreground paired with `accent`. */
  onAccent?: string;
}): RenderedEmail {
  const body = [
    emailEyebrow("Proposal"),
    emailHeading(proposalTitle, 1),
    emailText(
      `<strong style="color:${PALETTE.text};">${escapeHtml(senderName)}</strong> shared a proposal with you. Review it and respond right from the document.`,
    ),
    emailSpacer(8),
    emailButton({ label: "Open proposal", href: url, accent, onAccent }),
    fallbackUrlLine(url),
  ].join("");
  return {
    subject: `${senderName} sent you a proposal: ${proposalTitle}`,
    html: emailLayout({
      preheader: `${senderName} shared "${proposalTitle}" with you.`,
      body,
      orgName,
      logoUrl,
    }),
  };
}

/**
 * External assignment — the only channel an off-platform holder has.
 * Sent when a ticket / credential / travel / lodging assignment is issued
 * to (or changes state for) an `assignment_external_holders` party. No
 * app CTA (they have no account); optional claim URL when one exists.
 */
export function externalAssignmentEmail({
  holderName,
  assignmentTitle,
  kindLabel,
  stateLabel,
  projectName,
  orgName,
  detailLines = [],
  claimUrl,
}: {
  holderName?: string;
  assignmentTitle: string;
  /** e.g. "Ticket", "Credential". */
  kindLabel: string;
  /** e.g. "Issued", "Voided". */
  stateLabel: string;
  projectName?: string;
  orgName?: string;
  /** Extra plain-text facts (seat, gate, check-in) — each escaped. */
  detailLines?: string[];
  /** Absolute https URL to view / claim, when a public surface exists. */
  claimUrl?: string;
}): RenderedEmail {
  const greeting = holderName ? `Hi ${escapeHtml(holderName)},` : "Hi,";
  const context = projectName
    ? `Your ${escapeHtml(kindLabel.toLowerCase())} for <strong style="color:${PALETTE.text};">${escapeHtml(projectName)}</strong> is now ${escapeHtml(stateLabel.toLowerCase())}.`
    : `Your ${escapeHtml(kindLabel.toLowerCase())} is now ${escapeHtml(stateLabel.toLowerCase())}.`;
  const parts = [
    emailEyebrow(`${kindLabel} ${stateLabel}`),
    emailHeading(assignmentTitle, 1),
    emailText(greeting),
    emailText(context),
  ];
  if (detailLines.length > 0) {
    parts.push(
      emailText(detailLines.map((line) => escapeHtml(line)).join("<br />")),
    );
  }
  if (claimUrl) {
    parts.push(emailSpacer(8), emailButton({ label: `View ${kindLabel.toLowerCase()}`, href: claimUrl }), fallbackUrlLine(claimUrl));
  }
  parts.push(
    emailDivider(),
    emailText(
      `<span style="color:${PALETTE.tertiary};font-size:13px;">Keep this email. It is your record${orgName ? ` from ${escapeHtml(orgName)}` : ""}. Questions? Reply and the sending team will see it.</span>`,
    ),
  );
  return {
    subject: `${kindLabel} ${stateLabel.toLowerCase()}: ${assignmentTitle}`,
    html: emailLayout({
      preheader: `${kindLabel} ${stateLabel.toLowerCase()} — ${assignmentTitle}`,
      body: parts.join(""),
      orgName,
    }),
  };
}
