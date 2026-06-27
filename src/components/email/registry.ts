/**
 * ATLVS Email Kit — template registry.
 *
 * A discoverable id → { label, render } map. `render` takes a loosely-typed
 * props object so the registry can be driven by a generic preview/admin
 * surface; the strongly-typed template functions in `templates.ts` remain
 * the canonical call site for production senders.
 */

import {
  welcomeEmail,
  verifyEmail,
  inviteEmail,
  announcementEmail,
  type RenderedEmail,
} from "./templates";

export type EmailTemplateId =
  | "welcome"
  | "verify"
  | "invite"
  | "announcement";

export type EmailTemplateEntry = {
  /** Human-readable label for pickers / admin UIs. */
  label: string;
  /** Short description of when this template fires. */
  description: string;
  /** Render with a props bag (keys per the matching template signature). */
  render: (props: Record<string, string>) => RenderedEmail;
  /** Sample props for previews / fixtures. */
  sample: Record<string, string>;
};

export const EMAIL_TEMPLATES: Record<EmailTemplateId, EmailTemplateEntry> = {
  welcome: {
    label: "Welcome",
    description: "Sent after signup — sets the tone, points to first run.",
    render: (p) => welcomeEmail({ name: p.name ?? "", ctaUrl: p.ctaUrl ?? "" }),
    sample: { name: "Riley", ctaUrl: "https://app.atlvs.pro/studio" },
  },
  verify: {
    label: "Verify email",
    description: "One-time verification code + magic link.",
    render: (p) =>
      verifyEmail({ code: p.code ?? "", verifyUrl: p.verifyUrl ?? "" }),
    sample: {
      code: "739204",
      verifyUrl: "https://atlvs.pro/auth/verify?token=abc123",
    },
  },
  invite: {
    label: "Org invitation",
    description: "Invite a person into an organization.",
    render: (p) =>
      inviteEmail({
        inviter: p.inviter ?? "",
        orgName: p.orgName ?? "",
        acceptUrl: p.acceptUrl ?? "",
      }),
    sample: {
      inviter: "Dana Cruz",
      orgName: "Meridian Live",
      acceptUrl: "https://atlvs.pro/auth/accept?token=xyz789",
    },
  },
  announcement: {
    label: "Announcement",
    description: "Campaign-style broadcast with a single CTA.",
    render: (p) =>
      announcementEmail({
        title: p.title ?? "",
        body: p.body ?? "",
        ctaLabel: p.ctaLabel ?? "Learn more",
        ctaUrl: p.ctaUrl ?? "",
      }),
    sample: {
      title: "Reports & Analytics is live",
      body: "Forty-three reports, computed from your real data. No setup, no spreadsheets — just open the hub and read your show.",
      ctaLabel: "See the reports",
      ctaUrl: "https://app.atlvs.pro/studio/reports",
    },
  },
};

/** All template ids, for iteration in pickers / tests. */
export const EMAIL_TEMPLATE_IDS = Object.keys(
  EMAIL_TEMPLATES,
) as EmailTemplateId[];
