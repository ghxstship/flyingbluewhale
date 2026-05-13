/**
 * Production-AI use cases. Each entry powers an /ai/[slug] page.
 *
 * Voice rule: every claim grounded in workspace data, not the public
 * internet. Anthropic Claude under the hood; we never train on customer
 * data. The hub at /ai is the GEO surface that picks up "AI for
 * advancing / for tour managers / for production teams" intent.
 */

export type AiUseCase = {
  slug: string;
  title: string;
  short: string;
  hero: string;
  /** What the AI takes as input from the workspace. */
  reads: string[];
  /** What the AI produces. */
  outputs: string[];
  /** How it shows up in the product. */
  surfaces: string[];
  /** Production modules the AI touches. */
  modules: string[];
  faqs: Array<{ q: string; a: string }>;
};

export const AI_USES: AiUseCase[] = [
  {
    slug: "advancing",
    title: "AI For Advancing",
    short: "Drafts riders, hospitality, stage plots, and per-stop variances from your workspace.",
    hero: "Advancing is the largest pre-event paper trail in live production. The AI assistant reads your project metadata, talent profile, venue specs, and prior-tour history, then drafts the typed deliverables your advancing flow expects — technical rider, hospitality rider, stage plot description, input list, ground transport, hotel block. You edit, you ship. The clock back goes down by days.",
    reads: [
      "Talent profile (preferred backline, monitor config, hospitality preferences)",
      "Venue specs (rigging points, power, dressing room count, freight elevator)",
      "Project metadata (load-in window, set time, headcount, per-diem rate)",
      "Prior tours from the same artist or production",
    ],
    outputs: [
      "Technical rider draft with audio I/O, monitor configuration, lighting needs",
      "Hospitality rider draft scoped to dietary + brand preferences on file",
      "Stage plot description tied to the venue's stage dimensions",
      "Input list pre-populated with mic + DI assignments by instrument",
      "Per-stop variance notes flagging changes from the canonical rider",
    ],
    surfaces: [
      "ATLVS advancing module — drafts inline on the deliverable",
      "GVTEWAY artist portal — artists review and counter-edit",
      "COMPVSS field — daily call sheets carry the advancing references",
    ],
    modules: ["advancing", "ai", "portals"],
    faqs: [
      {
        q: "Does the AI see other tours?",
        a: "No. The AI's scope is your organization. It can reference your prior tours but never another org's data — RLS-enforced at the database, not just in the app layer.",
      },
      {
        q: "Will it invent specs the artist didn't ask for?",
        a: "Drafts default to the artist's documented profile + venue defaults. When data is missing, the assistant flags the gap rather than guessing. You see what's grounded and what's inferred.",
      },
    ],
  },
  {
    slug: "incidents",
    title: "AI For Incident Reports",
    short: "Turns a phone-typed account into an OSHA-shaped incident record with evidence and corrective action.",
    hero: "Incident reporting at 2am from a field crew member rarely produces an audit-ready record. The AI takes whatever you type — three sentences, voice-to-text, a partial fragment — and structures it into the fields OSHA, your insurance carrier, and your EHS lead need: who, what, when, where, witnesses, severity classification, recordable status, recommended corrective action.",
    reads: [
      "Field-typed incident draft (text, voice transcript, photo metadata)",
      "OSHA 300/300A classification rules",
      "Org incident history (recurring hazards, prior corrective actions)",
      "Witnessed crew members from the scheduled call sheet",
    ],
    outputs: [
      "Structured incident record with mandatory OSHA fields populated",
      "Recordable / non-recordable classification with reasoning",
      "Suggested corrective action with owner and due date",
      "Crisis-comms template drafted if the incident exceeds severity threshold",
    ],
    surfaces: [
      "COMPVSS field — file from the phone, AI structures on submit",
      "ATLVS safety module — review queue with AI-suggested corrective actions",
      "ATLVS compliance — OSHA 300 log auto-rolls up classified incidents",
    ],
    modules: ["safety", "ai", "mobile", "compliance"],
    faqs: [
      {
        q: "Is the AI medically advising?",
        a: "No. It structures the report and suggests OSHA classification per published rules. Medical decisions stay with credentialed personnel; the AI never makes care recommendations.",
      },
      {
        q: "Does it route to legal automatically?",
        a: "Configurable per org. By default, severe-classification incidents notify the EHS lead and route to a review queue. Legal routing is an opt-in workflow.",
      },
    ],
  },
  {
    slug: "scheduling",
    title: "AI For Crew Scheduling",
    short: "Drafts call sheets and resolves conflicts against live availability and credentials.",
    hero: "Crew scheduling is constraint satisfaction at human-scale: who's qualified, who's available, who's credentialed for that zone, who's already at hour-cap for the week. The AI reads your roster, schedule, credentials matrix, and prior assignments, then drafts call sheets and surfaces the conflicts before they cost you. Show callers see resolved schedules; PMs see what almost slipped.",
    reads: [
      "Crew roster with role, credentials, certifications",
      "Run-of-show with per-cue department needs",
      "Prior week's hours toward overtime + union-rate triggers",
      "Travel-day buffers and per-diem rates",
    ],
    outputs: [
      "Call sheet draft with crew, role, call time, departure time",
      "Conflict report (double-booked crew, expired credentials, OT triggers)",
      "Suggested swaps when conflicts are detected",
      "Departure manifest with ground transport pairings",
    ],
    surfaces: [
      "ATLVS schedule module — call-sheet authoring with AI-suggested rows",
      "GVTEWAY crew portal — crew see their call with context",
      "COMPVSS field — call sheet in the pocket, offline-cached",
    ],
    modules: ["schedule", "ai", "portals"],
    faqs: [
      {
        q: "Does it auto-publish call sheets?",
        a: "No. The AI drafts; the PM publishes. Auto-publish is configurable per org but defaults to manual review on the first season.",
      },
    ],
  },
  {
    slug: "proposals",
    title: "AI For Proposals",
    short: "Drafts interactive proposals from a brief, scoped to your service catalog and prior wins.",
    hero: "Proposals win shows when they feel bespoke and arrive fast. The AI takes a discovery brief (client, scope, dates, budget range) and drafts an interactive proposal — scroll storytelling, live pricing, accept-in-place — anchored to your service catalog and the proposals that closed before. You polish, you send, you scope a deposit on accept.",
    reads: [
      "Discovery notes from the lead",
      "Your service catalog with current pricing",
      "Prior won proposals with similar shape (date range, scope, budget)",
      "Client portal preferences and brand styling on file",
    ],
    outputs: [
      "Interactive proposal draft with 23 standard block types pre-arranged",
      "Live pricing math anchored to your catalog rate cards",
      "Suggested upsell line items with justification",
      "Deposit / balance terms (default 60/40 on signature / load-in)",
    ],
    surfaces: [
      "ATLVS proposals module — draft, edit, send",
      "GVTEWAY client portal — scroll, accept, sign in place",
      "Stripe Connect — deposit invoiced on accept",
    ],
    modules: ["proposals", "ai", "finance", "portals"],
    faqs: [
      {
        q: "Can clients tell it was AI-drafted?",
        a: "If you ship it unedited — yes. The output is a draft, not a deliverable. Most teams use it to skip the boilerplate and spend their time on the differentiator.",
      },
    ],
  },
  {
    slug: "recaps",
    title: "AI For Post-Show Recaps",
    short: "Bundles photos, finance, incidents, and KPIs into a wrap recap on settlement day.",
    hero: "Wrap recaps land days late because someone has to walk the gallery, the budget, the incident log, and the box office. The AI bundles them: a per-show recap PDF with the day's photo highlights, final P&L vs. budget, recordable incidents, gate scan throughput, and the named action items for the next show. Settle clean, recap clean.",
    reads: [
      "Project gallery with photo timestamps + geo",
      "Final budget vs. actual vs. forecast (EAC)",
      "Incident log + OSHA-recordable summary",
      "Gate scan throughput + ticket reconciliation",
      "Post-mortem notes captured during strike",
    ],
    outputs: [
      "One-page executive recap for the client",
      "Multi-page operational recap for the production team",
      "PDF + ZIP bundle with curated photos",
      "Named action items rolling forward to the next show",
    ],
    surfaces: ["ATLVS finance — recap fires on settlement close", "GVTEWAY client portal — branded recap auto-share"],
    modules: ["ai", "finance", "photos", "safety"],
    faqs: [],
  },
  {
    slug: "safety",
    title: "AI For Safety Briefings",
    short: "Drafts the daily safety brief from the day's hazards, weather, and corrective actions.",
    hero: "Daily safety briefings rotate the same content with subtle adjustments — weather, today's site hazards, the previous day's near-miss, the open corrective actions. The AI drafts the briefing each morning from your inspection records, weather feed, and incident log, so the EHS lead opens a tablet with the right content, signs the roster, and runs the briefing in under five minutes.",
    reads: [
      "Today's weather forecast (heat / cold / wind / storm protocol triggers)",
      "Open corrective actions from prior incidents + inspections",
      "Today's load-in tasks with associated hazard categories",
      "PPE compliance status by zone",
    ],
    outputs: [
      "Daily safety brief with site-specific hazards + mitigations",
      "PPE checklist per zone",
      "Comms channel + emergency assembly point reminder",
      "Roster sign-on sheet pre-populated with crew on site today",
    ],
    surfaces: [
      "COMPVSS field — EHS opens the brief on the tablet, runs the roster",
      "ATLVS safety module — daily brief logged with sign-on attendance",
    ],
    modules: ["ai", "safety", "mobile"],
    faqs: [],
  },
];

export const AI_USES_BY_SLUG = Object.fromEntries(AI_USES.map((u) => [u.slug, u]));
