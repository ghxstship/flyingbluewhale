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
