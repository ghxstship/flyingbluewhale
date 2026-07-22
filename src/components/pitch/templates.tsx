// Sample ready-to-present deck — the ATLVS story.
//
// atlvsPitchDeck() returns an ordered array of slides telling the arc:
// problem → ecosystem → the four products → proof → the ask. Copy is pulled
// from the marketing-site positioning (the four-app story, the 8-gate XPMS
// lifecycle, the production-history receipts) and written in the world-builder
// voice (docs/brand/voice.md): wonder in the open + close, plain numbers in
// the middle, no competitor comparison, no emoji.
import {
  AgendaSlide,
  CloseSlide,
  QuoteSlide,
  SectionSlide,
  StatSlide,
  TitleSlide,
  TwoColSlide,
} from "./slides";

export function atlvsPitchDeck(): React.ReactNode[] {
  return [
    // ── Open ──────────────────────────────────────────────────────────
    <TitleSlide
      key="cover"
      eyebrow="ATLVS Technologies"
      title="You build worlds for a living."
      subtitle="A festival, a stadium tour, a film set, a gala: temporary worlds thousands of people live inside, then strike by morning. This is the platform that runs the whole thing with you."
      wordmark="ATLVS"
      footer="The pitch"
    />,

    <AgendaSlide
      key="agenda"
      eyebrow="Where we're headed"
      title="The walk-through"
      items={[
        "The problem with how productions run today",
        "One platform, four apps, one record",
        "ATLVS · COMPVSS · GVTEWAY · LEG3ND",
        "The receipts",
        "What we're asking for",
      ]}
    />,

    // ── Act I — the problem ───────────────────────────────────────────
    <SectionSlide key="sec-problem" index="01" title="The problem" subtitle="Production runs on spreadsheets, group chats, and a binder nobody can find at 2am." />,

    <TwoColSlide
      key="problem"
      eyebrow="Moving off the patchwork"
      title="The work is one story. The tools aren't."
      body="A show moves through the same arc every time: pitch, build, the night itself, the wrap. But the pitch lives in one tool, the crew call in another, the tickets somewhere else. Every handoff is a re-key, and every re-key is where things drop."
      bullets={[
        "Advancing details scattered across email threads",
        "Crew, vendors, and guests in tools that never talk",
        "No single place the whole production can see",
      ]}
    />,

    <StatSlide
      key="stat-arc"
      eyebrow="The lifecycle, end to end"
      stat="8"
      caption="gates from Discovery to Close: one production lifecycle the whole platform tracks, so nothing falls between phases."
      source="XPMS production lifecycle: Discovery → Design → Advance → Procurement → Build → Install → Operate → Close."
    />,

    // ── Act II — the ecosystem ────────────────────────────────────────
    <SectionSlide
      key="sec-eco"
      index="02"
      title="One platform"
      subtitle="Four apps over one record. We don't hand you a list and call it project management. We plot the work and ride along while you build it."
    />,

    <TwoColSlide
      key="eco"
      eyebrow="The ecosystem"
      title="The pitch, the build, the show, the wrap: where you can see it."
      body="ATLVS is the superset operator console. COMPVSS is the field. GVTEWAY is the public face. LEG3ND is the knowledge. They share one data spine, so a guest list, a crew call, and a settlement number are the same record everywhere."
      bullets={[
        "One record from sales lead to final cost report",
        "Internal org users and project-scoped externals, same spine",
        "Adopt the full platform, a single app, or just the modules you need",
      ]}
    />,

    // ── Act III — the four products ───────────────────────────────────
    <TwoColSlide
      key="atlvs"
      eyebrow="ATLVS · Experiential Productions"
      title="The operator console."
      body="ERP, CRM, and PM in one. Sales and CRM plus executive-level project, program, venue, design, estimating, governance, production, finance, procurement, and asset & logistics management."
      bullets={["The superset console for internal teams", "Sales pipeline through settlement", "Asset & logistics, advancing, governance"]}
    />,

    <TwoColSlide
      key="compvss"
      eyebrow="COMPVSS · Site & Venue Operations"
      title="The field, offline-first."
      body="Deskless-workforce-class field and venue ops for internal and external orgs. Punch a clock with no signal, file an incident from the floor, run the day-of without praying for bars."
      bullets={["Offline-first PWA, syncs when it can", "Time, incidents, comms, learning in hand", "Built for the people on the ground"]}
    />,

    <TwoColSlide
      key="gvteway"
      eyebrow="GVTEWAY · Public Interface & Marketplace"
      title="The public face."
      body="Every surface a fan, vendor, or applicant touches: tickets, stores, directory, jobs, peer-to-peer, RFPs, plus the host and commerce console behind them."
      bullets={["Ticketing, storefronts, marketplace", "Vendor payouts and a public discovery layer", "The portal where externals self-serve"]}
    />,

    <TwoColSlide
      key="legend"
      eyebrow="LEG3ND · Knowledge · LMS · Resources"
      title="The knowledge layer."
      body="The standard, courses and certifications, a resources hub, a priced catalog, and the AIGA signage library: the institutional memory a production usually loses the morning after."
      bullets={["Knowledge base, LMS, certifications", "Compliance and safety built in", "The signage and resource canon, reusable"]}
    />,

    // ── Act IV — proof ────────────────────────────────────────────────
    <SectionSlide key="sec-proof" index="03" title="The receipts" subtitle="Built by the studio that's been shipping these worlds for over a decade." />,

    <StatSlide key="stat-years" eyebrow="Track record" stat="14+" caption="years building experiential productions before any of this was software." />,

    <StatSlide key="stat-prod" eyebrow="Track record" stat="250+" caption="productions shipped. The patterns in this platform are paid for in real load-ins." />,

    <StatSlide
      key="stat-guests"
      eyebrow="Track record"
      stat="5M+"
      caption="guests served through the work this platform was built to run."
      source="From GHXSTSHIP Industries production history through 2026."
    />,

    <QuoteSlide
      key="quote"
      quote="We don't hand you a list and call it project management. We plot the work, ride along while you build it, and stay calm when something breaks."
      attribution="ATLVS Technologies"
      byline="Built by the taste-makers' studio"
    />,

    // ── Close — the ask ───────────────────────────────────────────────
    <CloseSlide
      key="close"
      eyebrow="What we're asking for"
      title="Build the next one with us."
      cta="Start at atlvs.pro"
      contact="atlvs.pro · A T L V S Technologies"
    />,
  ];
}
