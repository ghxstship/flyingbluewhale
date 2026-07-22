/**
 * ATLVS Email Kit — template registry.
 *
 * A discoverable id → { label, render } map. `render` takes a loosely-typed
 * props object so the registry can be driven by a generic preview/admin
 * surface; the strongly-typed template functions in `templates.ts` remain
 * the canonical call site for production senders.
 */

import { urlFor } from "@/lib/urls";
import {
  welcomeEmail,
  verifyEmail,
  inviteEmail,
  announcementEmail,
  notificationEmail,
  proposalShareEmail,
  externalAssignmentEmail,
  advanceInviteEmail,
  advanceReminderEmail,
  advanceLapseEmail,
  advanceAllocationEmail,
  schedulerBookingEmail,
  schedulerReminderEmail,
  type RenderedEmail,
} from "./templates";

export type EmailTemplateId =
  | "welcome"
  | "verify"
  | "invite"
  | "announcement"
  | "notification"
  | "proposal_share"
  | "external_assignment"
  | "advance_invite"
  | "advance_reminder"
  | "advance_lapse"
  | "advance_allocation"
  | "scheduler_booking"
  | "scheduler_reminder";

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
    description: "Sent after signup: sets the tone, points to first run.",
    render: (p) => welcomeEmail({ name: p.name ?? "", ctaUrl: p.ctaUrl ?? "" }),
    sample: { name: "Riley", ctaUrl: urlFor("platform") },
  },
  verify: {
    label: "Verify email",
    description: "One-time verification code + magic link.",
    render: (p) =>
      verifyEmail({ code: p.code ?? "", verifyUrl: p.verifyUrl ?? "" }),
    sample: {
      code: "739204",
      verifyUrl: urlFor("auth", "/auth/verify?token=abc123"),
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
      acceptUrl: urlFor("auth", "/auth/accept?token=xyz789"),
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
      body: "Forty-three reports, computed from your real data. No setup, no spreadsheets. Just open the hub and read your show.",
      ctaLabel: "See the reports",
      ctaUrl: urlFor("platform", "/reports"),
    },
  },
  notification: {
    label: "Notification",
    description: "Per-kind activity email behind the notification matrix's Email column.",
    render: (p) =>
      notificationEmail({
        eyebrow: p.eyebrow,
        title: p.title ?? "",
        body: p.body,
        ctaLabel: p.ctaLabel,
        ctaUrl: p.ctaUrl,
        orgName: p.orgName,
        prefsUrl: p.prefsUrl,
      }),
    sample: {
      eyebrow: "Assignment",
      title: "New credential assigned",
      body: "All-areas access for MMW26 Hialeah, load-in through strike.",
      ctaLabel: "Open in ATLVS",
      ctaUrl: urlFor("mobile", "/advances"),
      prefsUrl: urlFor("personal", "/me/notifications"),
    },
  },
  proposal_share: {
    label: "Proposal share",
    description: "A producer sends a proposal link; optionally co-branded.",
    render: (p) =>
      proposalShareEmail({
        proposalTitle: p.proposalTitle ?? "",
        senderName: p.senderName ?? "The team",
        url: p.url ?? "",
        orgName: p.orgName,
        logoUrl: p.logoUrl,
        accent: p.accent,
        onAccent: p.onAccent,
      }),
    sample: {
      proposalTitle: "MMW26 Hialeah Production Services",
      senderName: "Dana Cruz",
      url: urlFor("marketing", "/proposals/sample-token"),
      orgName: "Meridian Live",
    },
  },
  external_assignment: {
    label: "External assignment",
    description: "State email to an off-platform holder, their only channel.",
    render: (p) =>
      externalAssignmentEmail({
        holderName: p.holderName,
        assignmentTitle: p.assignmentTitle ?? "",
        kindLabel: p.kindLabel ?? "Ticket",
        stateLabel: p.stateLabel ?? "Issued",
        projectName: p.projectName,
        orgName: p.orgName,
      }),
    sample: {
      holderName: "Sam Ortiz",
      assignmentTitle: "GA Weekend Pass",
      kindLabel: "Ticket",
      stateLabel: "Issued",
      projectName: "MMW26 Hialeah",
      orgName: "Meridian Live",
    },
  },
  advance_invite: {
    label: "Advance invite",
    description: "The merge send: checklist summary, Contract ID, deadline, one portal CTA.",
    render: (p) =>
      advanceInviteEmail({
        recipientName: p.recipientName,
        projectCode: p.projectCode ?? "",
        projectName: p.projectName ?? "",
        team: p.team,
        company: p.company ?? "",
        voice: p.voice,
        contractId: p.contractId,
        deadlineLabel: p.deadlineLabel,
        portalUrl: p.portalUrl ?? "",
        supportOwner: p.supportOwner,
        orgName: p.orgName,
      }),
    sample: {
      recipientName: "Jordan Reyes",
      projectCode: "MMW26_Hialeah",
      projectName: "MMW26 Hialeah",
      team: "Lasers",
      company: "LaserNet",
      voice: "neutral",
      contractId: "CT-4F2A9C1B",
      deadlineLabel: "Tue, May 6 · 11:00",
      portalUrl: urlFor("portal", "/mmw26/advancing?t=sample-token"),
      supportOwner: "Dana Cruz",
      orgName: "Meridian Live",
    },
  },
  advance_reminder: {
    label: "Advance reminder",
    description: "T-5 / T-2 chase, outstanding sections only.",
    render: (p) =>
      advanceReminderEmail({
        variant: p.variant === "t2" ? "t2" : "t5",
        recipientName: p.recipientName,
        projectCode: p.projectCode ?? "",
        projectName: p.projectName ?? "",
        team: p.team,
        company: p.company ?? "",
        voice: p.voice,
        deadlineLabel: p.deadlineLabel,
        portalUrl: p.portalUrl ?? "",
        orgName: p.orgName,
      }),
    sample: {
      variant: "t5",
      recipientName: "Jordan Reyes",
      projectCode: "MMW26_Hialeah",
      projectName: "MMW26 Hialeah",
      team: "Lasers",
      company: "LaserNet",
      deadlineLabel: "Tue, May 6 · 11:00",
      portalUrl: urlFor("portal", "/mmw26/advancing?t=sample-token"),
      orgName: "Meridian Live",
    },
  },
  advance_lapse: {
    label: "Advance lapse",
    description: "Deadline passed: owner alert plus recipient late flag.",
    render: (p) =>
      advanceLapseEmail({
        audience: p.audience === "owner" ? "owner" : "recipient",
        recipientName: p.recipientName,
        company: p.company ?? "",
        team: p.team,
        projectCode: p.projectCode ?? "",
        projectName: p.projectName ?? "",
        voice: p.voice,
        portalUrl: p.portalUrl ?? "",
        orgName: p.orgName,
      }),
    sample: {
      audience: "recipient",
      recipientName: "Jordan Reyes",
      company: "LaserNet",
      team: "Lasers",
      projectCode: "MMW26_Hialeah",
      projectName: "MMW26 Hialeah",
      portalUrl: urlFor("portal", "/mmw26/advancing?t=sample-token"),
      orgName: "Meridian Live",
    },
  },
  advance_allocation: {
    label: "Allocation confirmation",
    description: "T-2 before arrival: parking, credentials, wifi, catering counts.",
    render: (p) =>
      advanceAllocationEmail({
        recipientName: p.recipientName,
        projectCode: p.projectCode ?? "",
        projectName: p.projectName ?? "",
        team: p.team,
        company: p.company ?? "",
        voice: p.voice,
        allocationLines: p.allocationLines ? p.allocationLines.split("\n") : [],
        arrivalLabel: p.arrivalLabel,
        portalUrl: p.portalUrl,
        orgName: p.orgName,
      }),
    sample: {
      recipientName: "Jordan Reyes",
      projectCode: "MMW26_Hialeah",
      projectName: "MMW26 Hialeah",
      team: "Lasers",
      company: "LaserNet",
      allocationLines: "Parking · Zone C × 4\nCredentials · All Areas × 6\nWifi · LASERNET-OPS\nCatering · 6 standard",
      arrivalLabel: "Thu, May 8",
      portalUrl: urlFor("portal", "/mmw26/advancing?t=sample-token"),
      orgName: "Meridian Live",
    },
  },
  scheduler_booking: {
    label: "Scheduler booking",
    description: "Booking confirmation with reschedule/cancel links; ICS attached by the sender.",
    render: (p) =>
      schedulerBookingEmail({
        inviteeName: p.inviteeName,
        eventName: p.eventName ?? "",
        whenLabel: p.whenLabel ?? "",
        durationMinutes: Number(p.durationMinutes ?? "30"),
        locationLabel: p.locationLabel,
        rescheduleUrl: p.rescheduleUrl ?? "",
        cancelUrl: p.cancelUrl ?? "",
        orgName: p.orgName,
      }),
    sample: {
      inviteeName: "Jordan Reyes",
      eventName: "Site Orientation Call",
      whenLabel: "Tue, May 6 · 11:00 EDT",
      durationMinutes: "30",
      locationLabel: "Video call",
      rescheduleUrl: urlFor("marketing", "/book/sample-token?reschedule=abc"),
      cancelUrl: urlFor("marketing", "/book/sample-token?cancel=abc"),
      orgName: "Meridian Live",
    },
  },
  scheduler_reminder: {
    label: "Scheduler reminder",
    description: "Pre-booking reminder with the same reschedule/cancel links.",
    render: (p) =>
      schedulerReminderEmail({
        inviteeName: p.inviteeName,
        eventName: p.eventName ?? "",
        whenLabel: p.whenLabel ?? "",
        locationLabel: p.locationLabel,
        rescheduleUrl: p.rescheduleUrl ?? "",
        cancelUrl: p.cancelUrl ?? "",
        orgName: p.orgName,
      }),
    sample: {
      inviteeName: "Jordan Reyes",
      eventName: "Site Orientation Call",
      whenLabel: "Tue, May 6 · 11:00 EDT",
      locationLabel: "Video call",
      rescheduleUrl: urlFor("marketing", "/book/sample-token?reschedule=abc"),
      cancelUrl: urlFor("marketing", "/book/sample-token?cancel=abc"),
      orgName: "Meridian Live",
    },
  },
};

/** All template ids, for iteration in pickers / tests. */
export const EMAIL_TEMPLATE_IDS = Object.keys(
  EMAIL_TEMPLATES,
) as EmailTemplateId[];
