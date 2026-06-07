/**
 * Marketing templates catalogue. Each template is a production artifact
 * — ROS, advancing checklist, rider, call sheet, daily safety brief —
 * with a description and "what's in it" structure. Deep-link CTAs open
 * the template inside ATLVS via /signup?template={slug}.
 */

export type TemplateConfig = {
  slug: string;
  title: string;
  category: "schedule" | "advancing" | "safety" | "finance" | "procurement";
  short: string;
  long: string;
  whatsInIt: string[];
  bestFor: string[];
  /** Module the template lives in once opened in ATLVS. */
  module: string;
};

export const TEMPLATES: TemplateConfig[] = [
  {
    slug: "festival-ros",
    title: "Festival Run-of-Show",
    category: "schedule",
    short: "Multi-stage festival ROS with set times, changeovers, and crew calls per stage.",
    long: "A multi-stage festival run-of-show keyed to set times, changeover windows, and per-stage crew calls. Pre-wired with the canonical cue-number / department / note structure that show callers expect.",
    whatsInIt: [
      "Per-stage ROS row template with cue, time, duration, department, note",
      "Changeover blocks with target durations",
      "Set time × artist roster table",
      "Crew call sheet ps-skel tied to ROS rows",
      "21-day production calendar look-ahead",
    ],
    bestFor: ["Festival directors", "Stage managers", "Show callers"],
    module: "schedule",
  },
  {
    slug: "tour-advancing-checklist",
    title: "Tour Advancing Checklist",
    category: "advancing",
    short: "Per-stop advancing checklist with 16 deliverable types — rider, plot, input list, hotel, ground.",
    long: "The canonical advancing checklist for touring — every deliverable that needs confirmation before load-in at each stop. Templated for the 16 typed deliverable categories.",
    whatsInIt: [
      "Technical rider — submit / received / approved status",
      "Hospitality rider — submit / received / approved status",
      "Stage plot + input list — versioned attachments",
      "Hotel block + ground transport — confirmed / pending",
      "Insurance certificates — current / expired flag",
      "Credentials manifest — per-stop count",
      "Catering + per-diem — confirmed / paid",
    ],
    bestFor: ["Tour managers", "Production managers", "Advancing coordinators"],
    module: "advancing",
  },
  {
    slug: "stage-rider",
    title: "Stage Rider Template",
    category: "advancing",
    short: "Boilerplate technical rider with audio I/O, monitor, lighting, video, and stage requirements.",
    long: "A reusable technical rider boilerplate that artists and crew can fork per-tour. Covers the canonical sections every venue and production team expects.",
    whatsInIt: [
      "Audio I/O channel list",
      "Monitor configuration",
      "Lighting console + fixture preferences",
      "Video playback + IMAG needs",
      "Stage dimensions + riser locations",
      "Power requirements with circuit breakdown",
      "Backline + drum kit specs",
    ],
    bestFor: ["Artists", "Tour managers", "Production designers"],
    module: "advancing",
  },
  {
    slug: "daily-safety-brief",
    title: "Daily Safety Brief",
    category: "safety",
    short: "Per-day safety briefing template covering hazards, PPE, weather, and emergency procedures.",
    long: "The daily safety briefing template that production-floor crews run at the start of each shift. Covers the day's hazards, weather forecast, PPE requirements, and emergency procedure refresh.",
    whatsInIt: [
      "Today's site hazards + mitigations",
      "PPE required per zone",
      "Weather forecast + heat/cold protocol",
      "Emergency assembly point + evacuation route",
      "Comms channel assignments",
      "Sign-on sheet for attendance record",
    ],
    bestFor: ["EHS leads", "Site supervisors", "Crew bosses"],
    module: "safety",
  },
  {
    slug: "incident-report",
    title: "Incident Report Form",
    category: "safety",
    short: "OSHA-compliant incident report with witness statements, photo evidence, and corrective action.",
    long: "The incident report form template that captures everything OSHA wants to see — and everything your insurance carrier will ask for if a claim follows. Anonymous-capable for safeguarding reports.",
    whatsInIt: [
      "Incident metadata — date, time, location, witnesses",
      "Description of events leading up to and during",
      "Photo + diagram evidence",
      "Initial medical response taken",
      "Recordable classification (OSHA 300)",
      "Corrective action assigned + due date",
    ],
    bestFor: ["EHS leads", "Safety officers", "Medical leads"],
    module: "safety",
  },
  {
    slug: "vendor-coi-checklist",
    title: "Vendor COI Checklist",
    category: "procurement",
    short: "Per-vendor onboarding checklist — COI, W-9, payout account, scope of work.",
    long: "The vendor onboarding checklist that gates a vendor before any PO can be cut. Catches expired insurance and missing W-9s before they become audit findings.",
    whatsInIt: [
      "Certificate of Insurance (COI) — current, additional-insured, limits",
      "W-9 or W-8 series on file",
      "Stripe Connect payout account onboarded",
      "Scope of work signed",
      "MSA or NDA executed (if applicable)",
      "Compliance acknowledgements completed",
    ],
    bestFor: ["Procurement managers", "Vendor coordinators"],
    module: "procurement",
  },
];

export const TEMPLATES_BY_SLUG = Object.fromEntries(TEMPLATES.map((t) => [t.slug, t]));
