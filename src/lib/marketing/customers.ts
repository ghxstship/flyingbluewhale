/**
 * Customer stories — published + in-progress.
 *
 * Published entries render the full case study at /customers/[slug].
 * In-progress entries surface on the /customers hub as cards with an
 * expected publish window, so the surface isn't an empty state. NDA-
 * restricted entries can preview a sanitized story while the full
 * version stays gated behind a sales conversation.
 */

export type CustomerStory = {
  slug: string;
  /** Anonymized handle until publish; replaced with real name on publish. */
  displayName: string;
  industry:
    | "festivals-tours"
    | "concerts"
    | "fabrication"
    | "immersive-experiences"
    | "brand-activations"
    | "broadcast-tv-film"
    | "live-events"
    | "corporate-events"
    | "theatrical-performances";
  status: "published" | "in_progress" | "nda";
  /** Expected publish quarter (e.g., "Q3 2026"). Only meaningful for in_progress. */
  expectedPublish?: string;
  /** Sanitized 1-line teaser visible on the hub. */
  teaser: string;
  /** Three hard metrics that will land on publish (placeholders for in_progress). */
  metrics: Array<{ value: string; label: string }>;
};

export const CUSTOMER_STORIES: CustomerStory[] = [
  {
    slug: "festival-residency-15k",
    displayName: "Festival Residency Operator (NDA)",
    industry: "festivals-tours",
    status: "in_progress",
    expectedPublish: "Q3 2026",
    teaser:
      "15k-guest residency moved off Eventbrite + Asana + spreadsheets onto one platform; cut wrap-recap time from 14 days to 3.",
    metrics: [
      { value: "−78%", label: "wrap recap time" },
      { value: "0", label: "duplicate ticket scans" },
      { value: "+1 day", label: "earlier punch close" },
    ],
  },
  {
    slug: "scenic-fabrication-shop",
    displayName: "Scenic Fab Shop (NDA)",
    industry: "fabrication",
    status: "in_progress",
    expectedPublish: "Q3 2026",
    teaser:
      "Replaced a 4-spreadsheet workflow with RFIs, submittals, daily logs, and punch — closed first show a full day ahead.",
    metrics: [
      { value: "−1 day", label: "punch close" },
      { value: "100%", label: "RFI answer rate" },
      { value: "+24%", label: "fewer build-day surprises" },
    ],
  },
  {
    slug: "touring-production-co",
    displayName: "Touring Production Co. (NDA)",
    industry: "concerts",
    status: "in_progress",
    expectedPublish: "Q4 2026",
    teaser:
      "Six-month tour run on ATLVS — per-stop advancing, day sheets to portal, per-diem auto-flowed to payroll, settled clean.",
    metrics: [
      { value: "−12 hr/wk", label: "PM admin time" },
      { value: "100%", label: "per-diem accuracy" },
      { value: "0", label: "missed advancing items" },
    ],
  },
  {
    slug: "brand-activation-agency",
    displayName: "Brand Activation Agency (NDA)",
    industry: "brand-activations",
    status: "in_progress",
    expectedPublish: "Q4 2026",
    teaser:
      "Interactive proposals + Stripe Connect deposit on accept — closed deals 5 days faster on average, 100% paid-on-time.",
    metrics: [
      { value: "−5 days", label: "deal cycle" },
      { value: "100%", label: "on-time deposits" },
      { value: "+18%", label: "proposal acceptance" },
    ],
  },
  {
    slug: "immersive-experience-studio",
    displayName: "Immersive Experience Studio (NDA)",
    industry: "immersive-experiences",
    status: "in_progress",
    expectedPublish: "Q4 2026",
    teaser:
      "Procore-style RFI / submittal / punch workflow tuned to 6-week immersive builds — show-ready gate caught 3 issues that would have made the AHJ pull permits.",
    metrics: [
      { value: "3", label: "show-stopping issues caught pre-doors" },
      { value: "100%", label: "AHJ pass rate" },
      { value: "−40%", label: "punch-list rework" },
    ],
  },
  {
    slug: "broadcast-compound",
    displayName: "Broadcast Compound (NDA)",
    industry: "broadcast-tv-film",
    status: "in_progress",
    expectedPublish: "Q1 2027",
    teaser:
      "Compound ops on ATLVS — credentials, vendor COIs, daily safety briefs, incident intake. OSHA 300 log auto-rolled.",
    metrics: [
      { value: "100%", label: "COI compliance at audit" },
      { value: "−6 hr", label: "daily safety briefing prep" },
      { value: "0", label: "lost incident reports" },
    ],
  },
];

export const CUSTOMER_STORIES_BY_SLUG = Object.fromEntries(CUSTOMER_STORIES.map((s) => [s.slug, s]));

export const PUBLISHED_CUSTOMER_STORIES = CUSTOMER_STORIES.filter((s) => s.status === "published");
export const IN_PROGRESS_CUSTOMER_STORIES = CUSTOMER_STORIES.filter((s) => s.status === "in_progress");
