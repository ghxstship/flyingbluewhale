export type CaseStudy = {
  slug: string;
  name: string;
  industry: string;
  blurb: string;
  headline: string;
  hero: string;
  stats: Array<{ value: string; label: string }>;
  challenge: string[];
  solution: string[];
  outcome: string[];
  quote: { text: string; attribution: string };
  modules: string[];
  timeline: string;
  keywords: string[];
};

export const COMMUNITY: Record<string, CaseStudy> = {
  "black-coffee-mmw26": {
    slug: "black-coffee-mmw26",
    name: "Black Coffee · Miami Music Week 2026",
    industry: "Live events · festival",
    blurb: "15K guests, 3 stages, 6-role KBYG rollout. Open-Air at Hialeah Park.",
    headline: "How Black Coffee ran a 15K-cap festival on a single platform.",
    hero: "Miami Music Week 2026 — Black Coffee's Open-Air at Hialeah Park. Three stages, 15,000 capacity, six stakeholder personas, one weekend. Zero tools outside ATLVS, GVTEWAY, and COMPVSS.",
    stats: [
      { value: "15K", label: "Guests scanned in" },
      { value: "14,982", label: "Scans replayed from offline queue" },
      { value: "0", label: "Duplicate admits" },
      { value: "6", label: "Persona KBYG rollouts" },
    ],
    challenge: [
      "Previous year's production ran on a stack of eight tools: Asana, Notion, Eventbrite, a fabrication-shop spreadsheet, DocuSign, Slack, a group text for production, and a clipboard at the gate.",
      "Advancing for a 60-person crew + 14-vendor supply chain required four people full-time in email threads for six weeks.",
      "Venue is known for killing cell signal once a crowd arrives — the previous year lost an estimated 8% of scans to a scanner app that couldn't queue offline.",
      "Six distinct stakeholder personas (guest, artist, crew, vendor, sponsor, club) with wildly different information needs — a single PDF KBYG was unmanageable.",
    ],
    solution: [
      "Migrated to the Second Star Technologies suite three months before show. One Supabase project, one schema, one design system across internal + external + mobile.",
      "Authored one canonical KBYG in ATLVS CMS. The Boarding Pass pattern rendered six different persona views from the same config — no PDF duplication, no sync drift.",
      "Crew installed COMPVSS PWA from the URL. Zero App Store review. Scanner cached app shell + today's data before doors; queued scans during the signal dead-zone at peak.",
      "Vendor portal (GVTEWAY) handled 14 vendors' COIs, W-9s, POs, and Stripe Connect payouts. Finance closed books on the Monday after show.",
    ],
    outcome: [
      "15,000 guests scanned in. Zero duplicate admits — Postgres atomic UPDATE rejected the small number of double-scans cleanly.",
      "Offline scan queue replayed 14,982 events on reconnect. No lost scans reported by the gate team.",
      "Advancing time down from four FTE-weeks to one FTE-week. Deliverables model replaced email threads with typed rows + history.",
      "Books closed 72 hours post-show. Last year: 21 days.",
    ],
    quote: {
      text: "The scanner worked when the signal didn't. That alone would have been worth the switch. The rest of it is that we now run production the way our finance team wants us to.",
      attribution: "Production director, Black Coffee tour",
    },
    modules: ["ATLVS", "GVTEWAY (6 personas)", "COMPVSS", "Event guides (Boarding Pass)", "Advancing", "Stripe Connect"],
    timeline: "Migrated March 2026 · Showed April 2026",
    keywords: ["festival production case study", "Black Coffee MMW26", "Hialeah Park festival", "offline ticket scanning", "15K capacity event"],
  },

  "live-events-inc": {
    slug: "live-events-inc",
    name: "Live Events Inc.",
    industry: "Corporate activations · agency",
    blurb: "Moved production ops off Notion + Excel + DocuSign and cut invoicing cycle from 14 to 2 days.",
    headline: "How Live Events Inc. compressed their invoicing cycle by 86%.",
    hero: "Live Events Inc. is a 22-person corporate activation agency running 40–60 shows a year. They migrated to the Second Star Technologies suite to kill their internal duct tape. The invoicing cycle compression was the surprise.",
    stats: [
      { value: "86%", label: "Faster invoicing cycle" },
      { value: "14 → 2", label: "Days from show close to client invoice" },
      { value: "40+", label: "Shows per year on platform" },
      { value: "22", label: "Team members on unlimited Professional tier" },
    ],
    challenge: [
      "Invoicing was a two-person job for two weeks after every show. Expenses lived in Google Drive folders by show name. Receipts in email. Per diems in someone's Notes app. Reconciliation was manual.",
      "Client-facing proposals were PowerPoint decks emailed as PDFs. Accept/decline was a scheduled call. Versioning was a filename convention.",
      "Advancing was spread across three tools: Notion for the internal wiki, email threads for vendor coordination, DocuSign for contracts.",
    ],
    solution: [
      "Every expense, mileage log, per diem, and time entry now captured in ATLVS finance. Receipts in Supabase Storage with signed-URL delivery. Budget variance live, not post-show.",
      "Proposals migrated to the interactive proposal module. Scroll-activated sections, structured pricing, accept-in-place. Clients sign at a URL, not in an email attachment.",
      "Advancing refactored around the 16 typed deliverables. No more mystery threads; every deliverable has an owner, status, due date, and history row.",
    ],
    outcome: [
      "Invoicing cycle dropped from 14 days to 2 days. Finance closes within the week after show.",
      "Proposal-to-accept rate improved from 34% to 51% after moving to scroll proposals — clients opened and scrolled 3× more than they opened PDFs.",
      "Agency owner reports 'finance is a 2-hour Monday, not a 10-hour week.'",
    ],
    quote: {
      text: "We used to think finance was broken because our team was disorganized. It turns out finance was broken because our tools were fragmented. One platform fixed it.",
      attribution: "Owner, Live Events Inc.",
    },
    modules: ["ATLVS Finance", "Procurement", "Interactive proposals", "Advancing"],
    timeline: "Migrated Jan 2026 · Measured through Q1 2026",
    keywords: ["corporate events case study", "event agency software", "invoicing cycle", "production agency finance"],
  },

  "touring-agency": {
    slug: "touring-agency",
    name: "North Pole Touring",
    industry: "Artist management · touring",
    blurb: "40+ shows/year, unified advancing + artist portal for every artist on roster.",
    headline: "How North Pole moved 40+ shows/year off email threads.",
    hero: "North Pole Touring manages eight artists and advances 40+ shows a year. Every show used to be an email thread that outlived it. Now every show is an ATLVS project with typed deliverables, a role-scoped artist portal, and history that outlives the show.",
    stats: [
      { value: "40+", label: "Shows advanced per year" },
      { value: "8", label: "Artists on unified roster" },
      { value: "16", label: "Standard deliverable types per show" },
      { value: "100%", label: "Tour advancing on one platform" },
    ],
    challenge: [
      "Each tour manager had their own way of advancing: some used Google Docs, some Notion, some just email. When a TM left, institutional knowledge walked out the door.",
      "Artists wanted visibility into their runs but couldn't safely see backend advancing data. 'Just send them the schedule' became another manual export every week.",
      "Per-show advancing quality depended entirely on which human was doing it. A great TM produced a clean run; a mediocre TM produced chaos.",
    ],
    solution: [
      "Every show uses the same 16 typed deliverables: tech rider, hospitality, ground transport, hotel block, stage plot, input list, insurance cert, credentials, etc. New TMs inherit the template; nothing gets forgotten.",
      "Each artist gets a GVTEWAY artist portal scoped to their own runs. They see their schedule, their deliverables, their call sheets — and nothing from the other artists on the roster.",
      "Advancing history persists past the tour. When a venue asks 'what did you do last time,' the answer is two clicks away, not buried in a departed TM's inbox.",
    ],
    outcome: [
      "Onboarding a new tour manager dropped from 2 weeks to 3 days.",
      "Artist-side feedback 'I never know what's happening' reports went to zero after portal launch.",
      "Venue relationships strengthened because advancing quality became consistent across the roster.",
    ],
    quote: {
      text: "The deliverables model is a quiet revolution. Every show has the same spine. Anyone can pick up any show. It took us 12 years to realize that's what we'd been missing.",
      attribution: "Head of touring, North Pole",
    },
    modules: ["ATLVS Advancing", "GVTEWAY Artist portal", "Event guides", "Finance"],
    timeline: "Migrated Nov 2025 · In steady state since Feb 2026",
    keywords: ["touring case study", "artist management software", "tour advancing", "artist portal"],
  },
};

export const COMMUNITY_LIST = Object.values(COMMUNITY);
