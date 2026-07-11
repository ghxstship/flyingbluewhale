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
import { advanceSubject } from "@/lib/advancing/merge";

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

// ─── Advance email set (kit 27) ─────────────────────────────────────────────
//
// The merge engine's outbound surface. Subject grammar is the established
// campaign convention: `{ProjectCode} Advance | {Team} · {Company}` — the
// emoji prefix appears ONLY when the packet voice is not neutral
// (decision #3: neutral default, per-project flair opt-in). The voice
// setting alters greeting/sign-off strings only, never layout.

function advanceGreeting(voice: string | undefined, name?: string): string {
  const who = name ? escapeHtml(name) : "there";
  return voice === "flair" ? `${who}, good to have you on this one.` : `Hi ${who},`;
}

function advanceSignOff(voice: string | undefined): string {
  return voice === "flair" ? "See you on site." : "Questions? Reply to this thread and the advance team will see it.";
}

export type AdvanceChecklistLine = {
  label: string;
  requirement: "required" | "optional";
  dueLabel?: string;
};

function checklistHtml(lines: AdvanceChecklistLine[]): string {
  return lines
    .map((line) => {
      const req = line.requirement === "required" ? "Required" : "Optional";
      const due = line.dueLabel ? ` · due ${escapeHtml(line.dueLabel)}` : "";
      return `<strong style="color:${PALETTE.text};">${escapeHtml(line.label)}</strong> · ${req}${due}`;
    })
    .join("<br />");
}

/**
 * Advance invite — the send. Email is the invite, the portal is the packet:
 * greeting, checklist summary, Contract ID, deadline, one CTA.
 */
export function advanceInviteEmail({
  recipientName,
  projectCode,
  projectName,
  team,
  company,
  voice,
  contractId,
  checklist = [],
  deadlineLabel,
  portalUrl,
  supportOwner,
  orgName,
}: {
  recipientName?: string;
  projectCode: string;
  projectName: string;
  team?: string | null;
  company: string;
  voice?: string;
  contractId?: string | null;
  checklist?: AdvanceChecklistLine[];
  deadlineLabel?: string | null;
  portalUrl: string;
  supportOwner?: string | null;
  orgName?: string;
}): RenderedEmail {
  const parts = [
    emailEyebrow("Project Advance"),
    emailHeading(projectName, 1),
    emailText(advanceGreeting(voice, recipientName)),
    emailText(
      `Everything your team needs to advance <strong style="color:${PALETTE.text};">${escapeHtml(projectName)}</strong> is in your packet: overview, schedule, worksheets, and scheduling. Submit through the portal. No copies, no attachments.`,
    ),
  ];
  if (checklist.length > 0) {
    parts.push(emailText(checklistHtml(checklist)));
  }
  if (deadlineLabel) {
    parts.push(
      emailText(
        `<strong style="color:${PALETTE.text};">Advance submission deadline: ${escapeHtml(deadlineLabel)}.</strong>`,
      ),
    );
  }
  if (contractId) {
    parts.push(emailText("Your Contract ID. Quote it in every thread:"), emailCodePanel(contractId));
  }
  parts.push(emailSpacer(8), emailButton({ label: "Open your advance packet", href: portalUrl }), fallbackUrlLine(portalUrl));
  parts.push(
    emailDivider(),
    emailText(
      `<span style="color:${PALETTE.tertiary};font-size:13px;">${advanceSignOff(voice)}${supportOwner ? ` Your contact: ${escapeHtml(supportOwner)}.` : ""}</span>`,
    ),
  );
  return {
    subject: advanceSubject({ projectCode, team, company, voice }),
    html: emailLayout({
      preheader: `Your ${projectName} advance packet is ready.`,
      body: parts.join(""),
      orgName,
    }),
  };
}

/**
 * Advance reminder — T-5 / T-2 variants, outstanding sections only.
 */
export function advanceReminderEmail({
  variant,
  recipientName,
  projectCode,
  projectName,
  team,
  company,
  voice,
  outstanding = [],
  deadlineLabel,
  portalUrl,
  orgName,
}: {
  variant: "t5" | "t2";
  recipientName?: string;
  projectCode: string;
  projectName: string;
  team?: string | null;
  company: string;
  voice?: string;
  outstanding?: AdvanceChecklistLine[];
  deadlineLabel?: string | null;
  portalUrl: string;
  orgName?: string;
}): RenderedEmail {
  const window = variant === "t5" ? "five days" : "two days";
  const parts = [
    emailEyebrow(variant === "t5" ? "Advance Reminder · T-5" : "Advance Reminder · T-2"),
    emailHeading(projectName, 1),
    emailText(advanceGreeting(voice, recipientName)),
    emailText(
      deadlineLabel
        ? `Your advance deadline is <strong style="color:${PALETTE.text};">${escapeHtml(deadlineLabel)}</strong>, ${window} out. These sections are still open:`
        : `Your advance deadline is ${window} out. These sections are still open:`,
    ),
  ];
  if (outstanding.length > 0) parts.push(emailText(checklistHtml(outstanding)));
  parts.push(emailSpacer(8), emailButton({ label: "Finish your advance", href: portalUrl }), fallbackUrlLine(portalUrl));
  parts.push(
    emailDivider(),
    emailText(`<span style="color:${PALETTE.tertiary};font-size:13px;">${advanceSignOff(voice)}</span>`),
  );
  return {
    subject: `Reminder ${variant === "t5" ? "T-5" : "T-2"} | ${advanceSubject({ projectCode, team, company, voice: "neutral" })}`,
    html: emailLayout({
      preheader: `Advance sections still open for ${projectName}.`,
      body: parts.join(""),
      orgName,
    }),
  };
}

/**
 * Advance lapse — dual audience: the packet owner gets the alert, the
 * recipient gets the late flag with the on-site consequence.
 */
export function advanceLapseEmail({
  audience,
  recipientName,
  company,
  team,
  projectCode,
  projectName,
  voice,
  outstanding = [],
  portalUrl,
  orgName,
}: {
  audience: "owner" | "recipient";
  recipientName?: string;
  company: string;
  team?: string | null;
  projectCode: string;
  projectName: string;
  voice?: string;
  outstanding?: AdvanceChecklistLine[];
  portalUrl: string;
  orgName?: string;
}): RenderedEmail {
  const isOwner = audience === "owner";
  const parts = [
    emailEyebrow("Advance Lapsed"),
    emailHeading(projectName, 1),
    emailText(
      isOwner
        ? `The advance for <strong style="color:${PALETTE.text};">${escapeHtml(team ? `${team} · ${company}` : company)}</strong> lapsed with sections still open.`
        : advanceGreeting(voice, recipientName),
    ),
    emailText(
      isOwner
        ? "No chasing threads required. The open sections are listed below and on the tracking board."
        : `Your advance deadline for <strong style="color:${PALETTE.text};">${escapeHtml(projectName)}</strong> has passed with sections still open. Teams without a completed advance are not permitted to work on site.`,
    ),
  ];
  if (outstanding.length > 0) parts.push(emailText(checklistHtml(outstanding)));
  parts.push(
    emailSpacer(8),
    emailButton({ label: isOwner ? "Open the tracking board" : "Complete your advance now", href: portalUrl }),
    fallbackUrlLine(portalUrl),
  );
  return {
    subject: `Lapsed | ${advanceSubject({ projectCode, team, company, voice: "neutral" })}`,
    html: emailLayout({
      preheader: `Advance lapsed · ${team ? `${team} · ${company}` : company}.`,
      body: parts.join(""),
      orgName,
    }),
  };
}

/**
 * Allocation confirmation — sent T-2 before each team's arrival: parking
 * zones, credentials, wifi, catering counts. Thin wrapper over the
 * external-assignment details pattern.
 */
export function advanceAllocationEmail({
  recipientName,
  projectCode,
  projectName,
  team,
  company,
  voice,
  allocationLines = [],
  arrivalLabel,
  portalUrl,
  orgName,
}: {
  recipientName?: string;
  projectCode: string;
  projectName: string;
  team?: string | null;
  company: string;
  voice?: string;
  /** Plain-text allocation facts (each escaped): "Parking · Zone C × 4". */
  allocationLines?: string[];
  arrivalLabel?: string | null;
  portalUrl?: string;
  orgName?: string;
}): RenderedEmail {
  const parts = [
    emailEyebrow("Allocations Confirmed"),
    emailHeading(projectName, 1),
    emailText(advanceGreeting(voice, recipientName)),
    emailText(
      arrivalLabel
        ? `Your team arrives <strong style="color:${PALETTE.text};">${escapeHtml(arrivalLabel)}</strong>. Here is what is confirmed and waiting for you:`
        : "Here is what is confirmed and waiting for your team on site:",
    ),
  ];
  if (allocationLines.length > 0) {
    parts.push(emailText(allocationLines.map((line) => escapeHtml(line)).join("<br />")));
  }
  if (portalUrl) {
    parts.push(emailSpacer(8), emailButton({ label: "View your packet", href: portalUrl }), fallbackUrlLine(portalUrl));
  }
  parts.push(
    emailDivider(),
    emailText(`<span style="color:${PALETTE.tertiary};font-size:13px;">${advanceSignOff(voice)}</span>`),
  );
  return {
    subject: `Confirmed | ${advanceSubject({ projectCode, team, company, voice: "neutral" }).replace(" Advance |", " Allocations |")}`,
    html: emailLayout({
      preheader: `Allocations confirmed for ${team ? `${team} · ${company}` : company}.`,
      body: parts.join(""),
      orgName,
    }),
  };
}

/**
 * Scheduler booking confirmation — reschedule/cancel links in every email
 * (Calendly parity); the ICS attachment rides the sender payload.
 */
export function schedulerBookingEmail({
  inviteeName,
  eventName,
  whenLabel,
  durationMinutes,
  locationLabel,
  rescheduleUrl,
  cancelUrl,
  orgName,
}: {
  inviteeName?: string;
  eventName: string;
  /** Localized "Tue, May 6 · 11:00 EDT" line — preformatted by the caller. */
  whenLabel: string;
  durationMinutes: number;
  locationLabel?: string;
  rescheduleUrl: string;
  cancelUrl: string;
  orgName?: string;
}): RenderedEmail {
  const parts = [
    emailEyebrow("Booking Confirmed"),
    emailHeading(eventName, 1),
    emailText(inviteeName ? `Hi ${escapeHtml(inviteeName)},` : "Hi,"),
    emailText(
      `You're booked: <strong style="color:${PALETTE.text};">${escapeHtml(whenLabel)}</strong> · ${durationMinutes} min${locationLabel ? ` · ${escapeHtml(locationLabel)}` : ""}. A calendar invite is attached.`,
    ),
    emailSpacer(8),
    emailButton({ label: "Reschedule", href: rescheduleUrl }),
    emailText(
      `<a href="${cancelUrl}" target="_blank" rel="noopener" style="color:${PALETTE.tertiary};font-size:13px;text-decoration:underline;">Cancel this booking</a>`,
    ),
    emailDivider(),
    emailText(
      `<span style="color:${PALETTE.tertiary};font-size:13px;">Need a different time? Rescheduling keeps your place in the advance.</span>`,
    ),
  ];
  return {
    subject: `Booked: ${eventName} · ${whenLabel}`,
    html: emailLayout({
      preheader: `Confirmed · ${eventName}, ${whenLabel}.`,
      body: parts.join(""),
      orgName,
    }),
  };
}

/**
 * Scheduler reminder — sent ahead of the booking, same links.
 */
export function schedulerReminderEmail({
  inviteeName,
  eventName,
  whenLabel,
  locationLabel,
  rescheduleUrl,
  cancelUrl,
  orgName,
}: {
  inviteeName?: string;
  eventName: string;
  whenLabel: string;
  locationLabel?: string;
  rescheduleUrl: string;
  cancelUrl: string;
  orgName?: string;
}): RenderedEmail {
  const parts = [
    emailEyebrow("Upcoming Booking"),
    emailHeading(eventName, 1),
    emailText(inviteeName ? `Hi ${escapeHtml(inviteeName)},` : "Hi,"),
    emailText(
      `A reminder: <strong style="color:${PALETTE.text};">${escapeHtml(whenLabel)}</strong>${locationLabel ? ` · ${escapeHtml(locationLabel)}` : ""}.`,
    ),
    emailSpacer(8),
    emailButton({ label: "Reschedule", href: rescheduleUrl }),
    emailText(
      `<a href="${cancelUrl}" target="_blank" rel="noopener" style="color:${PALETTE.tertiary};font-size:13px;text-decoration:underline;">Cancel this booking</a>`,
    ),
  ];
  return {
    subject: `Reminder: ${eventName} · ${whenLabel}`,
    html: emailLayout({
      preheader: `Coming up · ${eventName}, ${whenLabel}.`,
      body: parts.join(""),
      orgName,
    }),
  };
}
