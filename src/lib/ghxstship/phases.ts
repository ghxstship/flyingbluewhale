import type { Phase } from "./types";

/**
 * Eight Production Phases (8PP) — the temporal navigation.
 * Discovery → Concept → Develop → Advance → Build → Show → Strike → Wrap.
 */
export const PHASES: Phase[] = [
  {
    number: "01",
    slug: "discovery",
    name: "Discovery",
    buyerIntent: "Defining scope, budget envelope, venue, and feasibility before creative is greenlit.",
    whatHappens:
      "Site sourcing, feasibility assessment, agreement architecture, insurance binding, immigration and customs prep, federation liaison, institutional compliance scoping.",
    activeServices: [1, 2, 7, 34, 40, 42, 57, 58, 62, 67, 68, 69, 79, 99, 102, 103, 108, 109, 111, 112],
  },
  {
    number: "02",
    slug: "concept",
    name: "Concept",
    buyerIntent:
      "Translating brief into visualizable creative direction with renderings and feasibility-validated scope.",
    whatHappens:
      "Scenic design, technical design, F&B menu development, retail and merch design, fan zone master planning, programming architecture, broadcast rights scoping.",
    activeServices: [
      3, 8, 9, 10, 13, 16, 21, 22, 23, 26, 28, 30, 31, 49, 54, 70, 71, 72, 73, 74, 75, 77, 80, 81, 82, 84, 85, 86, 100,
      104, 105, 106, 107, 113,
    ],
  },
  {
    number: "03",
    slug: "develop",
    name: "Develop",
    buyerIntent:
      "Engineering buildable, code-compliant, certified production designs with stamped documentation. Renamed from Engineering in v1.0.",
    whatHappens:
      "Stamped engineering, BOM finalization, MOT and crowd flow modeling, RFID/credentialing platform build, life safety planning, vendor onboarding, athletic and amusement compliance certification.",
    activeServices: [4, 5, 6, 11, 12, 14, 15, 17, 25, 27, 29, 32, 33, 36, 48, 50, 59, 60, 61, 63, 83, 87, 98, 101, 110],
  },
  {
    number: "04",
    slug: "advance",
    name: "Advance",
    buyerIntent:
      "Pre-show prep work — moving the project from finalized design into ready-to-build state. All logistics, supply, talent, and crew movement. Renamed and resequenced from Logistics in v1.0; now precedes Build.",
    whatHappens:
      "Talent and crew travel, accommodations block, ground transport, supply chain advance ship, per diem distribution, catering operations spin-up, fixer network activation.",
    activeServices: [24, 35, 36, 37, 38, 39, 41, 88, 89, 90, 93],
  },
  {
    number: "05",
    slug: "build",
    name: "Build",
    buyerIntent:
      "Physical assembly and installation on site. Combines previous Fabrication + Installation phases into a single contiguous Build phase in v1.0.",
    whatHappens:
      "Custom fabrication delivery, set construction, scenic install, AV deployment, power tie-in, signage install, F&B build-out, retail buildout, scenic rigging, FR treatment certification, crew load-in.",
    activeServices: [18, 19, 20, 43, 44, 45, 46, 47, 51, 52, 53, 56, 76, 78, 91, 92, 94, 95, 96, 97, 114],
  },
  {
    number: "06",
    slug: "show",
    name: "Show",
    buyerIntent:
      "Live event operation — guest experience, broadcast, and real-time decision-making while the show is up. Renamed from Activation in v1.0.",
    whatHappens:
      "Live operations across every class — show-call, hospitality service, F&B service, retail operation, broadcast transmission, real-time risk monitoring, federation compliance enforcement.",
    activeServices: [
      8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 30, 31, 45, 63, 71, 72, 73, 74, 76, 77,
      78, 79, 80, 81, 82, 84, 85, 86, 91, 92, 93, 94, 100, 101, 104, 106, 107, 110, 111, 113, 114,
    ],
  },
  {
    number: "07",
    slug: "strike",
    name: "Strike",
    buyerIntent: "De-rig, load-out, asset return, and physical removal from venue.",
    whatHappens: "Load-out, asset return to storage, road case packing, crew demobilization, fixer release.",
    activeServices: [43, 44, 55, 86, 87, 88, 90, 91, 92, 97],
  },
  {
    number: "08",
    slug: "wrap",
    name: "Wrap",
    buyerIntent:
      "Project closure — financial reconciliation, sustainability reporting, archival, and case study production. New named phase in v1.0; previously folded into Strike.",
    whatHappens:
      "Vendor invoice reconciliation, change-order closeout, P&L finalization, sustainability and ESG reporting, asset cataloging, portfolio submission, post-event commerce wind-down.",
    activeServices: [31, 41, 64, 65, 66],
  },
];

export const PHASE_BY_NUMBER = Object.fromEntries(PHASES.map((p) => [p.number, p])) as Record<Phase["number"], Phase>;
export const PHASE_BY_SLUG = Object.fromEntries(PHASES.map((p) => [p.slug, p])) as Record<Phase["slug"], Phase>;
