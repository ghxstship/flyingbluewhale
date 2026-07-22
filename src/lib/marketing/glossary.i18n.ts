/**
 * GENERATED FILE — do not hand-edit. Regenerate with:
 *   node --experimental-strip-types scripts/gen-marketing-i18n.mjs
 *
 * Render-site i18n overlay for src/lib/marketing/glossary.ts (I18N-WRAP, decision 7 rider).
 * The data file stays the SSOT for structure + English copy; this module
 * wraps every user-visible prose field in the 3-arg t(key, undefined,
 * fallback) form with PLAIN-STRING key and fallback literals so
 * scripts/extract-i18n-keys.mjs can land the keys in the locale catalogs.
 * Template-literal keys are invisible to the extractor, which is why every
 * slug is enumerated here instead of composed at the render site.
 *
 * Drift guard: i18n-content.test.ts asserts the identity-translator output
 * deep-equals the source entries, so data-file copy edits without a re-run
 * of the generator fail CI instead of silently shipping stale fallbacks.
 */

import { GLOSSARY_BY_SLUG, type GlossaryTerm } from "./glossary";

export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

const LOCALIZERS: Record<string, (e: GlossaryTerm, t: Translator) => GlossaryTerm> = {
  advancing: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.advancing.term", undefined, "Advancing"),
    short: t(
      "marketing.glossaryContent.advancing.short",
      undefined,
      "The pre-event workflow of finalizing every operational detail with each stakeholder.",
    ),
    long: t(
      "marketing.glossaryContent.advancing.long",
      undefined,
      "Advancing is the production process of confirming every operational detail with each stakeholder (artists, vendors, venues, crew) before load-in. It covers technical riders, hospitality riders, stage plots, input lists, ground transport, hotel blocks, insurance certificates, credentials, and any per-stop variances. Strong advancing reduces show-day surprise; weak advancing creates day-of fires that cost real money. In modern stacks, advancing is tracked as typed deliverables with status, owner, due date, and history, not as PDF chains in email.",
    ),
    aka: [
      t("marketing.glossaryContent.advancing.aka.0", undefined, "show advancing"),
      t("marketing.glossaryContent.advancing.aka.1", undefined, "tour advancing"),
      t("marketing.glossaryContent.advancing.aka.2", undefined, "artist advancing"),
    ],
  }),
  kbyg: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.kbyg.term", undefined, "KBYG (Know Before You Go)"),
    short: t(
      "marketing.glossaryContent.kbyg.short",
      undefined,
      "A pre-event briefing document scoped to a stakeholder's role.",
    ),
    long: t(
      "marketing.glossaryContent.kbyg.long",
      undefined,
      "KBYG, Know Before You Go, is a stakeholder-facing document that gathers everything someone needs to show up to an event prepared: schedule, set times, credentials, parking, dressing-room location, comms channels, PPE requirements, evacuation plan, code of conduct. The strongest KBYG implementations scope by role: a guest sees parking and schedule, a crew member sees radio channels and call sheet, an artist sees rider and hospitality. Same canonical content; different views.",
    ),
    aka: [
      t("marketing.glossaryContent.kbyg.aka.0", undefined, "boarding pass"),
      t("marketing.glossaryContent.kbyg.aka.1", undefined, "event guide"),
      t("marketing.glossaryContent.kbyg.aka.2", undefined, "know-before-you-go"),
    ],
  }),
  ros: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.ros.term", undefined, "Run-of-Show (ROS)"),
    short: t(
      "marketing.glossaryContent.ros.short",
      undefined,
      "The minute-by-minute schedule of an event: cues, transitions, departments.",
    ),
    long: t(
      "marketing.glossaryContent.ros.long",
      undefined,
      "Run-of-Show, or ROS, is the canonical minute-by-minute schedule of an event from doors through strike. Each row carries a cue number, a time, a duration, a department (audio, lighting, video, scenic, security, hospitality), and a note. Show callers and production managers run from the ROS in real time. The ROS publishes to portals so artists see set times, crew see calls, and vendors see delivery windows, all from one canonical record. A weak ROS lives in a shared document that nobody trusts after the second revision.",
    ),
    aka: [
      t("marketing.glossaryContent.ros.aka.0", undefined, "run of show"),
      t("marketing.glossaryContent.ros.aka.1", undefined, "show flow"),
      t("marketing.glossaryContent.ros.aka.2", undefined, "cue sheet"),
    ],
  }),
  "load-in": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.load-in.term", undefined, "Load-In"),
    short: t(
      "marketing.glossaryContent.load-in.short",
      undefined,
      "The process of moving gear and crew into a venue and building the show.",
    ),
    long: t(
      "marketing.glossaryContent.load-in.long",
      undefined,
      "Load-in is the period (from a few hours to several days) during which trucks unload, crew rigs the show, audio and lighting strike configurations, scenic elements assemble, and the event takes physical form in the venue. Load-in windows are negotiated with the venue and constrain everything downstream: rigging access times, freight elevator slots, parking, security clearances. Production managers track load-in against a per-department schedule and against the venue's hard constraints.",
    ),
    aka: [
      t("marketing.glossaryContent.load-in.aka.0", undefined, "bump-in"),
      t("marketing.glossaryContent.load-in.aka.1", undefined, "set-up"),
    ],
  }),
  "load-out": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.load-out.term", undefined, "Load-Out"),
    short: t(
      "marketing.glossaryContent.load-out.short",
      undefined,
      "The process of breaking down the show and clearing the venue.",
    ),
    long: t(
      "marketing.glossaryContent.load-out.long",
      undefined,
      "Load-out is the reverse of load-in: the show ends, doors clear, and crew dismantles audio, lighting, scenic, and rigging in reverse-build order to load trucks. Venues impose hard exit deadlines (often tied to next-day load-ins for the next event), and load-out velocity often determines whether overtime hours kick in. Tight load-out planning saves money and labor.",
    ),
    aka: [
      t("marketing.glossaryContent.load-out.aka.0", undefined, "strike"),
      t("marketing.glossaryContent.load-out.aka.1", undefined, "bump-out"),
      t("marketing.glossaryContent.load-out.aka.2", undefined, "tear-down"),
    ],
  }),
  strike: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.strike.term", undefined, "Strike"),
    short: t(
      "marketing.glossaryContent.strike.short",
      undefined,
      "The full breakdown and removal of all event production from a venue.",
    ),
    long: t(
      "marketing.glossaryContent.strike.long",
      undefined,
      "Strike is the final phase of an event: every piece of gear, scenic element, signage, cable run, and consumable is removed and the venue returned to its pre-event state. Strike is typically the highest-injury period of a show: crew is tired, deadlines are tight, and heavy gear is moving fast. That makes safety briefings, PPE compliance, and load-out scheduling especially important.",
    ),
    aka: [
      t("marketing.glossaryContent.strike.aka.0", undefined, "tear-down"),
      t("marketing.glossaryContent.strike.aka.1", undefined, "load-out"),
    ],
  }),
  "call-sheet": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.call-sheet.term", undefined, "Call Sheet"),
    short: t(
      "marketing.glossaryContent.call-sheet.short",
      undefined,
      "A per-day document telling each crew member when and where to report.",
    ),
    long: t(
      "marketing.glossaryContent.call-sheet.long",
      undefined,
      "A call sheet is the daily roster published to every crew member: their call time (when to arrive), department, role, location, and any specific instructions. Originally a film-production artifact, call sheets are now standard in events and touring. Modern call sheets publish to a stakeholder portal or mobile app rather than as PDF attachments, with automatic conflict detection against double-booked crew.",
    ),
    aka: [
      t("marketing.glossaryContent.call-sheet.aka.0", undefined, "crew sheet"),
      t("marketing.glossaryContent.call-sheet.aka.1", undefined, "day sheet"),
    ],
  }),
  "show-call": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.show-call.term", undefined, "Show Call"),
    short: t("marketing.glossaryContent.show-call.short", undefined, "The act of calling cues during the live event."),
    long: t(
      "marketing.glossaryContent.show-call.long",
      undefined,
      "Show calling is the live act of calling cues (lighting cues, audio cues, video cues, automation cues, talent intros, security pivots) during the show. The show caller works from the ROS, communicating over comms to each department. The show caller's role is the single most important live-event coordination position. A clean show call is invisible; a broken show call is the difference between a great show and a recoverable one.",
    ),
    aka: [t("marketing.glossaryContent.show-call.aka.0", undefined, "calling the show")],
  }),
  "set-time": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.set-time.term", undefined, "Set Time"),
    short: t(
      "marketing.glossaryContent.set-time.short",
      undefined,
      "The scheduled start time of an artist's performance.",
    ),
    long: t(
      "marketing.glossaryContent.set-time.long",
      undefined,
      "Set time is the moment an artist takes the stage. Set times are negotiated between booking and production, locked into the ROS, and published to artists via their advancing portal. Festivals typically have hard set time windows with strict changeover periods; concerts have softer windows tied to support-act performance. Conflicts between set times (overlapping stages with shared crew) surface in modern schedule tools automatically.",
    ),
    aka: [
      t("marketing.glossaryContent.set-time.aka.0", undefined, "stage time"),
      t("marketing.glossaryContent.set-time.aka.1", undefined, "performance slot"),
    ],
  }),
  doors: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.doors.term", undefined, "Doors"),
    short: t("marketing.glossaryContent.doors.short", undefined, "The time the venue opens to the public."),
    long: t(
      "marketing.glossaryContent.doors.long",
      undefined,
      "Doors is the moment the venue's public-facing entry opens. Everything inside the venue must be show-ready by doors: sound check complete, security in position, hospitality stocked, gates and scanners online. Doors is one of the show's hard gates: nothing slips past it. ROS counts forward from doors to set times and backward from doors to load-in milestones.",
    ),
    aka: [
      t("marketing.glossaryContent.doors.aka.0", undefined, "house open"),
      t("marketing.glossaryContent.doors.aka.1", undefined, "venue open"),
    ],
  }),
  "technical-rider": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.technical-rider.term", undefined, "Technical Rider"),
    short: t(
      "marketing.glossaryContent.technical-rider.short",
      undefined,
      "An artist's production-spec document covering audio, lighting, video, stage, and power.",
    ),
    long: t(
      "marketing.glossaryContent.technical-rider.long",
      undefined,
      "A technical rider is the document the artist's team sends ahead of a performance specifying the exact production setup required: audio I/O, monitor configuration, lighting needs, video playback, stage dimensions, riser locations, power requirements. Riders range from a single page (small touring acts) to dozens of pages (headliner festivals). Modern advancing systems track riders as typed deliverables, versioned, status-tracked, and acknowledged in writing.",
    ),
    aka: [
      t("marketing.glossaryContent.technical-rider.aka.0", undefined, "tech rider"),
      t("marketing.glossaryContent.technical-rider.aka.1", undefined, "production rider"),
    ],
  }),
  "hospitality-rider": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.hospitality-rider.term", undefined, "Hospitality Rider"),
    short: t(
      "marketing.glossaryContent.hospitality-rider.short",
      undefined,
      "An artist's non-production needs: food, drink, dressing room, transport.",
    ),
    long: t(
      "marketing.glossaryContent.hospitality-rider.long",
      undefined,
      "A hospitality rider lists the non-production needs of the artist's traveling party: catering preferences, dressing room stocking (drinks, snacks, towels), ground transport requirements, hotel preferences, runner allowances. Hospitality riders include both contractual obligations (catering by X time) and preferences (specific brands, dietary restrictions). Production teams treat hospitality riders as binding even when they're informal.",
    ),
    aka: [
      t("marketing.glossaryContent.hospitality-rider.aka.0", undefined, "hospitality contract"),
      t("marketing.glossaryContent.hospitality-rider.aka.1", undefined, "comfort rider"),
    ],
  }),
  "stage-plot": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.stage-plot.term", undefined, "Stage Plot"),
    short: t(
      "marketing.glossaryContent.stage-plot.short",
      undefined,
      "A diagram showing the placement of equipment, talent, and monitors onstage.",
    ),
    long: t(
      "marketing.glossaryContent.stage-plot.long",
      undefined,
      "A stage plot is the bird's-eye-view diagram of an artist's onstage configuration: where drums sit, where monitors face, where mic stands rise, where amps anchor. Stage plots inform the audio engineer, the monitor engineer, the lighting designer, and the staging team. They're submitted as PDF attachments to advancing and are increasingly stored as typed artifacts with revision history.",
    ),
    aka: [
      t("marketing.glossaryContent.stage-plot.aka.0", undefined, "stage layout"),
      t("marketing.glossaryContent.stage-plot.aka.1", undefined, "stage diagram"),
    ],
  }),
  "input-list": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.input-list.term", undefined, "Input List"),
    short: t(
      "marketing.glossaryContent.input-list.short",
      undefined,
      "An audio-channel-by-channel map of microphones, DI boxes, and patch points.",
    ),
    long: t(
      "marketing.glossaryContent.input-list.long",
      undefined,
      "An input list is the audio team's reference: every channel on the console, what's plugged into it (mic model, DI box, line in), and how it's labeled. Input lists are bundled with the technical rider, given to the front-of-house and monitor engineers in advance, and used to pre-patch the console before sound check. A clean input list saves hours at load-in.",
    ),
    aka: [
      t("marketing.glossaryContent.input-list.aka.0", undefined, "channel list"),
      t("marketing.glossaryContent.input-list.aka.1", undefined, "patch list"),
    ],
  }),
  coi: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.coi.term", undefined, "Certificate of Insurance (COI)"),
    short: t(
      "marketing.glossaryContent.coi.short",
      undefined,
      "A vendor's proof of insurance coverage for general liability and related risks.",
    ),
    long: t(
      "marketing.glossaryContent.coi.long",
      undefined,
      "A Certificate of Insurance, or COI, is the document a vendor submits to prove they carry general liability, auto liability, workers' compensation, and umbrella coverage at the limits a venue or producer requires. COIs name the producer or venue as additional insured and list policy effective and expiration dates. Production teams gate purchase orders behind a current COI: if the cert is expired, the PO blocks.",
    ),
    aka: [
      t("marketing.glossaryContent.coi.aka.0", undefined, "certificate of insurance"),
      t("marketing.glossaryContent.coi.aka.1", undefined, "liability cert"),
    ],
  }),
  w9: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.w9.term", undefined, "W-9"),
    short: t(
      "marketing.glossaryContent.w9.short",
      undefined,
      "A US tax form vendors complete to enable 1099 reporting.",
    ),
    long: t(
      "marketing.glossaryContent.w9.long",
      undefined,
      "Form W-9 is the IRS document a US vendor completes to give the producer their taxpayer ID number and business classification, enabling year-end 1099-NEC issuance for non-employee compensation. Production teams collect W-9s during vendor onboarding and gate payouts on having a current W-9 on file. Foreign vendors complete W-8 series forms instead.",
    ),
    aka: [
      t("marketing.glossaryContent.w9.aka.0", undefined, "W9"),
      t("marketing.glossaryContent.w9.aka.1", undefined, "Form W-9"),
    ],
  }),
  credentials: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.credentials.term", undefined, "Credentials"),
    short: t(
      "marketing.glossaryContent.credentials.short",
      undefined,
      "Physical or digital passes granting access to event-restricted areas.",
    ),
    long: t(
      "marketing.glossaryContent.credentials.long",
      undefined,
      "Credentials, also called passes, are the physical (laminate, wristband) or digital (QR, NFC) tokens that grant access to event-restricted areas. Tiered credentials (AAA all-access, working pass, talent pass, crew pass, vendor pass, guest pass) carry different access levels: front-of-house, backstage, dressing rooms, production offices, rigging zones. Credentials are issued from a manifest, scanned at zone gates, and revoked when someone leaves their role.",
    ),
    aka: [
      t("marketing.glossaryContent.credentials.aka.0", undefined, "passes"),
      t("marketing.glossaryContent.credentials.aka.1", undefined, "credentialing"),
      t("marketing.glossaryContent.credentials.aka.2", undefined, "access badges"),
    ],
  }),
  "all-access": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.all-access.term", undefined, "All-Access (AAA)"),
    short: t(
      "marketing.glossaryContent.all-access.short",
      undefined,
      "The highest credential tier, granting access to every zone.",
    ),
    long: t(
      "marketing.glossaryContent.all-access.long",
      undefined,
      "All-Access, often abbreviated AAA, is the top credential tier issued at a production: it grants access to every zone, including talent dressing rooms, production offices, and rigging areas. AAA credentials are tightly controlled; the AAA list is small and runs through senior production leadership. The credentials manager treats AAA as the most audit-sensitive credential tier.",
    ),
    aka: [
      t("marketing.glossaryContent.all-access.aka.0", undefined, "AAA"),
      t("marketing.glossaryContent.all-access.aka.1", undefined, "all access pass"),
    ],
  }),
  "working-pass": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.working-pass.term", undefined, "Working Pass"),
    short: t(
      "marketing.glossaryContent.working-pass.short",
      undefined,
      "A credential identifying crew or vendors actively working the event.",
    ),
    long: t(
      "marketing.glossaryContent.working-pass.long",
      undefined,
      "A working pass is the credential that identifies a person as crew or vendor actively working an event. Working passes typically grant access to backstage, production offices, and any zone needed for their role, but exclude high-restriction areas like artist dressing rooms unless the role requires it. Working pass holders are vetted at credential pickup and may sign acknowledgements at check-in.",
    ),
    aka: [t("marketing.glossaryContent.working-pass.aka.0", undefined, "working credential")],
  }),
  manifest: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.manifest.term", undefined, "Manifest"),
    short: t(
      "marketing.glossaryContent.manifest.short",
      undefined,
      "The canonical roster of who is credentialed, ticketed, or accommodated.",
    ),
    long: t(
      "marketing.glossaryContent.manifest.long",
      undefined,
      "A manifest is the canonical list: of credentialed crew, of ticketed guests, of accommodation-block residents, of vehicle passengers. Manifests reconcile against the gate scanner: every credential or ticket on the manifest scans to accepted; everything else scans to denied. A clean manifest is the difference between a smooth gate and a 30-minute line.",
    ),
    aka: [
      t("marketing.glossaryContent.manifest.aka.0", undefined, "roster"),
      t("marketing.glossaryContent.manifest.aka.1", undefined, "credential manifest"),
    ],
  }),
  "gate-scan": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.gate-scan.term", undefined, "Gate Scan"),
    short: t(
      "marketing.glossaryContent.gate-scan.short",
      undefined,
      "The act of scanning a credential or ticket to verify entry rights.",
    ),
    long: t(
      "marketing.glossaryContent.gate-scan.long",
      undefined,
      "Gate scan is the single most time-sensitive operation at a live event: a credential or ticket presents at the gate, scans against the manifest, and resolves to accepted, denied, voided, or used in under a hundred milliseconds. Modern gate scanners run as offline-first mobile apps so they keep working when venue cellular drops; scans queue locally and replay in order when signal returns. Race conditions (the same ticket presenting at two gates) resolve atomically: every ticket scans exactly once.",
    ),
    aka: [
      t("marketing.glossaryContent.gate-scan.aka.0", undefined, "check-in"),
      t("marketing.glossaryContent.gate-scan.aka.1", undefined, "scan-in"),
    ],
  }),
  "last-entry": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.last-entry.term", undefined, "Last Entry"),
    short: t(
      "marketing.glossaryContent.last-entry.short",
      undefined,
      "The deadline after which the gate stops admitting new attendees.",
    ),
    long: t(
      "marketing.glossaryContent.last-entry.long",
      undefined,
      "Last entry is the time after which the gate stops admitting guests. Most events publish a last-entry time in the KBYG so attendees know to arrive before it. Late entries are sometimes accommodated for VIP or talent guests via separate channels but rarely for the general public. The gate scanner enforces last entry: scans after the cutoff resolve to denied.",
    ),
    aka: [t("marketing.glossaryContent.last-entry.aka.0", undefined, "last admit")],
  }),
  rigging: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.rigging.term", undefined, "Rigging"),
    short: t(
      "marketing.glossaryContent.rigging.short",
      undefined,
      "The art of suspending lighting, audio, video, and scenic from venue structure.",
    ),
    long: t(
      "marketing.glossaryContent.rigging.long",
      undefined,
      "Rigging is the discipline of suspending heavy production gear (lighting trusses, line arrays, video walls, scenic) safely from a venue's structural points. Rigging crews work with the venue's rig plot to identify load-bearing points, calculate point loads and distributed loads, and rig motors, chains, and trusses. Rigging is among the highest-injury disciplines on a production; reputable shops use third-party rigging inspections before doors.",
    ),
    aka: [
      t("marketing.glossaryContent.rigging.aka.0", undefined, "rig"),
      t("marketing.glossaryContent.rigging.aka.1", undefined, "rigging crew"),
    ],
  }),
  "point-load": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.point-load.term", undefined, "Point Load"),
    short: t(
      "marketing.glossaryContent.point-load.short",
      undefined,
      "The weight applied at a single suspension point on a venue's rig structure.",
    ),
    long: t(
      "marketing.glossaryContent.point-load.long",
      undefined,
      "A point load is the static weight applied at a single suspension point in a venue's rigging structure: a single beam clamp, a single motor pickup. Venues publish rated capacities per point (e.g., 1,000 lbs per beam), and riggers must ensure no single point exceeds rated capacity. Point load math is on every rigging plot; modern production tools track it per suspension point with margins.",
    ),
    aka: [t("marketing.glossaryContent.point-load.aka.0", undefined, "static load")],
  }),
  "dynamic-load": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.dynamic-load.term", undefined, "Dynamic Load"),
    short: t(
      "marketing.glossaryContent.dynamic-load.short",
      undefined,
      "The peak load applied during motion or sudden change; it exceeds the static load.",
    ),
    long: t(
      "marketing.glossaryContent.dynamic-load.long",
      undefined,
      "Dynamic load is the peak force applied to a rigging point during motion (a lift, a release, a sudden stop) and can substantially exceed the static load. Rigging engineers calculate dynamic loads with safety factors (typically 7:1 over peak dynamic) to ensure structural integrity. The dynamic load math is why a motor with a static rating of 1,000 lbs isn't lifting 1,000 lbs of gear; it's lifting some fraction with the dynamic factor preserved.",
    ),
    aka: [t("marketing.glossaryContent.dynamic-load.aka.0", undefined, "kinetic load")],
  }),
  foh: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.foh.term", undefined, "Front of House (FOH)"),
    short: t(
      "marketing.glossaryContent.foh.short",
      undefined,
      "The audience-facing side of the venue, where the mixing console lives.",
    ),
    long: t(
      "marketing.glossaryContent.foh.long",
      undefined,
      "Front of House, FOH, refers to the audience-facing side of a venue and the audio mixing position located there. The FOH engineer mixes what the audience hears through the main sound system. FOH is also where the lighting console often sits, giving the lighting designer line-of-sight to the stage. In broader production usage, FOH refers to anything visible to the audience (signage, ushers, ticket scanners).",
    ),
    aka: [
      t("marketing.glossaryContent.foh.aka.0", undefined, "front-of-house"),
      t("marketing.glossaryContent.foh.aka.1", undefined, "audience side"),
    ],
  }),
  boh: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.boh.term", undefined, "Back of House (BOH)"),
    short: t(
      "marketing.glossaryContent.boh.short",
      undefined,
      "The non-public side of the venue: dressing rooms, production offices, loading.",
    ),
    long: t(
      "marketing.glossaryContent.boh.long",
      undefined,
      "Back of House, BOH, covers everything not visible to the audience: dressing rooms, production offices, loading docks, green rooms, catering, freight elevators. BOH access is credentialed: only working passes, talent passes, and higher-tier credentials get in. The line between FOH and BOH is the operational divide of a venue.",
    ),
    aka: [
      t("marketing.glossaryContent.boh.aka.0", undefined, "back-of-house"),
      t("marketing.glossaryContent.boh.aka.1", undefined, "backstage"),
    ],
  }),
  comms: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.comms.term", undefined, "Comms"),
    short: t(
      "marketing.glossaryContent.comms.short",
      undefined,
      "The wired or wireless intercom system connecting departments during a show.",
    ),
    long: t(
      "marketing.glossaryContent.comms.long",
      undefined,
      "Comms, short for communications, is the intercom infrastructure that lets show callers, stage managers, lighting, audio, video, and security talk to each other in real time during load-in, show call, and load-out. Comms channels separate by department; the show caller typically sits on a master channel that punches into each department's channel as needed. Wired comms (Clear-Com) and wireless comms (Riedel Bolero) coexist on most large productions.",
    ),
    aka: [
      t("marketing.glossaryContent.comms.aka.0", undefined, "intercom"),
      t("marketing.glossaryContent.comms.aka.1", undefined, "headset comms"),
    ],
  }),
  rfi: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.rfi.term", undefined, "Request for Information (RFI)"),
    short: t(
      "marketing.glossaryContent.rfi.short",
      undefined,
      "A formal question raised during production with a routed, official answer.",
    ),
    long: t(
      "marketing.glossaryContent.rfi.long",
      undefined,
      "A Request for Information, RFI, is a formal, tracked question raised during production: a contractor asks a producer for clarification on scope, a vendor asks for a spec confirmation, a producer asks a venue for an access detail. Each RFI has a recipient (ball-in-court), a clock (due date), and an official answer that becomes part of the project record. Construction projects pioneered the RFI pattern; live-event production borrows it for fabrication, scenic, and major build-outs.",
    ),
    aka: [t("marketing.glossaryContent.rfi.aka.0", undefined, "request for information")],
  }),
  submittal: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.submittal.term", undefined, "Submittal"),
    short: t(
      "marketing.glossaryContent.submittal.short",
      undefined,
      "A formal product or spec submission for approval before installation.",
    ),
    long: t(
      "marketing.glossaryContent.submittal.long",
      undefined,
      "A submittal is the formal proposal a contractor or vendor sends for review and approval before installing or fabricating: a paint color, a lighting fixture model, a custom-built piece, a finish material. Submittals route through a reviewer, get approved-as-noted, rejected, or approved-with-revisions, and become part of the project record. Strong submittal workflows prevent costly mid-build pivots.",
    ),
    aka: [t("marketing.glossaryContent.submittal.aka.0", undefined, "spec submittal")],
  }),
  "punch-list": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.punch-list.term", undefined, "Punch List"),
    short: t(
      "marketing.glossaryContent.punch-list.short",
      undefined,
      "The list of remaining items to fix before a build is considered complete.",
    ),
    long: t(
      "marketing.glossaryContent.punch-list.long",
      undefined,
      "A punch list, also called a snag list, is the running register of items that need attention before a build or installation is considered complete: paint touch-ups, wire dressings, finish corrections, missing labels, alignment issues. Each item has a location, a responsible trade, a photo, and a due date. The punch list closes via a final walk-through where each item is signed off.",
    ),
    aka: [
      t("marketing.glossaryContent.punch-list.aka.0", undefined, "snag list"),
      t("marketing.glossaryContent.punch-list.aka.1", undefined, "punch"),
      t("marketing.glossaryContent.punch-list.aka.2", undefined, "close-out list"),
    ],
  }),
  "change-order": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.change-order.term", undefined, "Change Order"),
    short: t(
      "marketing.glossaryContent.change-order.short",
      undefined,
      "A formal modification to scope, schedule, or price after the contract is signed.",
    ),
    long: t(
      "marketing.glossaryContent.change-order.long",
      undefined,
      "A change order is the formal mechanism for modifying a signed contract: scope changes, schedule extensions, price adjustments. Change orders quantify the work in question, price it, and require approval before execution. In events and fabrication, change orders prevent the all-too-common 'the producer asked for this, we did it, now no one wants to pay for it' pattern. Every change order writes to the project budget on approval.",
    ),
    aka: [
      t("marketing.glossaryContent.change-order.aka.0", undefined, "change-of-scope"),
      t("marketing.glossaryContent.change-order.aka.1", undefined, "CO"),
    ],
  }),
  "show-ready": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.show-ready.term", undefined, "Show-Ready"),
    short: t(
      "marketing.glossaryContent.show-ready.short",
      undefined,
      "A gated status indicating a project is complete and cleared for doors.",
    ),
    long: t(
      "marketing.glossaryContent.show-ready.long",
      undefined,
      "Show-ready is the gate that has to clear before doors open: every inspection signed, every punch item resolved, every credential printed, every comms checked. Modern production tools enforce show-ready as a hard gate: invoicing, doors, or final payment can't proceed without it. Show-ready is the producer's equivalent of construction's substantial-completion.",
    ),
    aka: [
      t("marketing.glossaryContent.show-ready.aka.0", undefined, "doors-ready"),
      t("marketing.glossaryContent.show-ready.aka.1", undefined, "go-status"),
    ],
  }),
  "incident-report": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.incident-report.term", undefined, "Incident Report"),
    short: t(
      "marketing.glossaryContent.incident-report.short",
      undefined,
      "A documented record of a safety, security, or medical event during a production.",
    ),
    long: t(
      "marketing.glossaryContent.incident-report.long",
      undefined,
      "An incident report is the documented record of any safety, security, or medical event during a production: an injury, a near-miss, a security intervention, a medical response, an environmental release. Incident reports capture the time, location, witnesses, photos, and resolution. OSHA-recordable incidents flow into the annual 300 log. Anonymous reporting channels, where the reporter chooses what they disclose, are increasingly standard for safeguarding and harassment reporting.",
    ),
    aka: [
      t("marketing.glossaryContent.incident-report.aka.0", undefined, "safety report"),
      t("marketing.glossaryContent.incident-report.aka.1", undefined, "near-miss report"),
    ],
  }),
  "osha-300": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.osha-300.term", undefined, "OSHA 300 Log"),
    short: t(
      "marketing.glossaryContent.osha-300.short",
      undefined,
      "The US workplace-injury and illness log required by federal OSHA regulations.",
    ),
    long: t(
      "marketing.glossaryContent.osha-300.long",
      undefined,
      "The OSHA Form 300 is the log of work-related injuries and illnesses that US employers with more than ten employees maintain annually. Each entry records the case, the employee, the date, the diagnosis, and the outcome (days away, restricted work, transfer). The 300A annual summary is posted publicly Feb-Apr each year. Production teams with field-injury exposure run this against the 300 and 300A as part of their year-end compliance cadence.",
    ),
    aka: [
      t("marketing.glossaryContent.osha-300.aka.0", undefined, "OSHA log"),
      t("marketing.glossaryContent.osha-300.aka.1", undefined, "Form 300"),
    ],
  }),
  "near-miss": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.near-miss.term", undefined, "Near-Miss"),
    short: t(
      "marketing.glossaryContent.near-miss.short",
      undefined,
      "An incident with potential for harm that didn't result in injury or damage.",
    ),
    long: t(
      "marketing.glossaryContent.near-miss.long",
      undefined,
      "A near-miss is an event with potential for harm (a falling object that didn't hit anyone, an unsecured cable that almost tripped a crew member, an electrical issue caught before contact) that didn't result in injury or property damage. Robust safety cultures capture near-misses at higher rates than recordable incidents because they're the leading indicator. Each near-miss is an opportunity to fix a structural risk before it costs someone.",
    ),
    aka: [t("marketing.glossaryContent.near-miss.aka.0", undefined, "close call")],
  }),
  "per-diem": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.per-diem.term", undefined, "Per Diem"),
    short: t(
      "marketing.glossaryContent.per-diem.short",
      undefined,
      "A daily allowance paid to crew or talent for meals and incidentals while traveling.",
    ),
    long: t(
      "marketing.glossaryContent.per-diem.long",
      undefined,
      "Per diem is the daily cash allowance paid to crew or talent for meals and incidentals while traveling for a production. Per diem rates vary by city and country (GSA publishes US federal rates) and may differ for crew vs. union-rate crew vs. talent. Per diem typically settles in cash on a per-show basis or accumulates on a paystub. Tour managers track per diem against the city × day rate matrix.",
    ),
    aka: [t("marketing.glossaryContent.per-diem.aka.0", undefined, "PD")],
  }),
  advance: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.advance.term", undefined, "Advance (Cash Advance)"),
    short: t(
      "marketing.glossaryContent.advance.short",
      undefined,
      "A cash payment made ahead of a production to cover anticipated expenses.",
    ),
    long: t(
      "marketing.glossaryContent.advance.long",
      undefined,
      "A cash advance, in production-finance context, is money paid ahead of a show to cover anticipated expenses: per diem, runner cash, vendor deposits, on-the-fly purchases. Cash advances reconcile against receipts and remaining cash on settlement night. Note: 'advancing' (the pre-event workflow) and 'cash advance' (the finance instrument) are different concepts that share a name; context distinguishes them.",
    ),
    aka: [
      t("marketing.glossaryContent.advance.aka.0", undefined, "float"),
      t("marketing.glossaryContent.advance.aka.1", undefined, "cash float"),
    ],
  }),
  settlement: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.settlement.term", undefined, "Settlement"),
    short: t(
      "marketing.glossaryContent.settlement.short",
      undefined,
      "The post-show financial reconciliation between artist, promoter, and venue.",
    ),
    long: t(
      "marketing.glossaryContent.settlement.long",
      undefined,
      "Settlement is the post-show financial close-out: reconciling box-office numbers, deducting venue costs, paying artist guarantees and back-end percentages, settling per diems, and producing a settlement sheet signed by the artist's representative. Settlements happen at the venue, often the same night as the show, and depend on accurate, real-time box-office data. Mature production stacks run settlement off live data, not next-day spreadsheets.",
    ),
    aka: [t("marketing.glossaryContent.settlement.aka.0", undefined, "show settle")],
  }),
  xpms: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.xpms.term", undefined, "XPMS (Experiential Production Management Standard)"),
    short: t(
      "marketing.glossaryContent.xpms.short",
      undefined,
      "A shared standard for experiential production work: phases, departments, disciplines, and canonical work atoms.",
    ),
    long: t(
      "marketing.glossaryContent.xpms.long",
      undefined,
      "XPMS is the Experiential Production Management Standard, a structured taxonomy that gives live-event and experiential production a common language for planning, executing, and auditing work. Version 2.5, the current release, defines 9 gated phases, 10 department classes, 79 disciplines, and 406 canonical work atoms, each atom carrying 44 fields in the standard's SSOT Bible. Because tasks, budget lines, catalogs, and compliance checks all anchor to the same taxonomy, teams and tools interoperate without renegotiating vocabulary on every project. The ATLVS ecosystem ships XPMS 2.5 as its default base kit: a new organization arrives pre-seeded with the standard's phases, department classes, and atom catalog, and layers its own customizations on top.",
    ),
    aka: [
      t("marketing.glossaryContent.xpms.aka.0", undefined, "experiential production management standard"),
      t("marketing.glossaryContent.xpms.aka.1", undefined, "XPMS 2.5"),
    ],
  }),
  "gated-phases": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.gated-phases.term", undefined, "Gated Phases"),
    short: t(
      "marketing.glossaryContent.gated-phases.short",
      undefined,
      "The nine sequential XPMS production phases, each closed by a gate: Discover, Design, Advance, Procure, Build, Install, Operate, Amplify, Close.",
    ),
    long: t(
      "marketing.glossaryContent.gated-phases.long",
      undefined,
      "Gated phases are the sequential macro arc of a production under XPMS: Discover, Design, Advance, Procure, Build, Install, Operate, Amplify, Close. Each phase ends at a gate, a checkpoint where defined criteria must clear before downstream work proceeds, which keeps procurement from outrunning design and settlement from starting before operations close. Amplify is the XPMS 2.5 addition at gate 8: content capture, media and press, broadcast, and post-event campaigns treated as first-class production work with their own gate. In the ATLVS ecosystem every project carries its XPMS phase, and the console renders the lifecycle as a live checklist from sell through settle.",
    ),
    aka: [
      t("marketing.glossaryContent.gated-phases.aka.0", undefined, "production phases"),
      t("marketing.glossaryContent.gated-phases.aka.1", undefined, "phase gates"),
      t("marketing.glossaryContent.gated-phases.aka.2", undefined, "nine phases"),
    ],
  }),
  "coordinate-matrix": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.coordinate-matrix.term", undefined, "Coordinate Matrix"),
    short: t(
      "marketing.glossaryContent.coordinate-matrix.short",
      undefined,
      "The XPMS lens that crosses 9 phases with 10 department classes, giving every task one of 90 coordinates.",
    ),
    long: t(
      "marketing.glossaryContent.coordinate-matrix.long",
      undefined,
      "The coordinate matrix is the XPMS planning lens formed by crossing the standard's 9 gated phases with its 10 department classes, yielding 90 coordinates. Any unit of production work lands at exactly one coordinate (Technology work during Install, Executive work during Discover), which makes gaps and overloads visible at a glance: an empty coordinate is unplanned scope, an overloaded one is a staffing risk. The ATLVS ecosystem uses the coordinate matrix as a task and forecasting lens, rolling tasks and hours up by phase and department class so producers can see where the work actually sits.",
    ),
    aka: [
      t("marketing.glossaryContent.coordinate-matrix.aka.0", undefined, "phase-department matrix"),
      t("marketing.glossaryContent.coordinate-matrix.aka.1", undefined, "90 coordinates"),
    ],
  }),
  urid: (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.urid.term", undefined, "URID"),
    short: t(
      "marketing.glossaryContent.urid.short",
      undefined,
      "The XPMS identifier grammar DEPT.DISCIPLINE.CATEGORY: a stable, sortable address for every kind of production work.",
    ),
    long: t(
      "marketing.glossaryContent.urid.long",
      undefined,
      "A URID is an identifier following the XPMS grammar DEPT.DISCIPLINE.CATEGORY: the department class, the discipline within it, and the category of work. The grammar gives every kind of production work a stable, sortable address, so a budget line, a task in a plan, and an item in a catalog can all point to the same identifier and reconcile cleanly. XPMS 2.5 spans 10 department classes and 79 disciplines under this grammar. In the ATLVS ecosystem, URIDs key the catalog and knowledge surfaces, tying priced atoms and templates back to the standard.",
    ),
    aka: [
      t("marketing.glossaryContent.urid.aka.0", undefined, "URID grammar"),
      t("marketing.glossaryContent.urid.aka.1", undefined, "resource identifier"),
    ],
  }),
  "work-atom": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.work-atom.term", undefined, "Work Atom"),
    short: t(
      "marketing.glossaryContent.work-atom.short",
      undefined,
      "The canonical unit of production work in XPMS, fully specified so it can be scheduled, priced, and audited consistently.",
    ),
    long: t(
      "marketing.glossaryContent.work-atom.long",
      undefined,
      "A work atom is the smallest canonical unit of production work defined by XPMS: one discrete, repeatable piece of work with a stable identity and a full specification. Each atom carries 44 fields in the standard's SSOT Bible, covering identity, phase and department coordinates, dependencies, and crew and compliance requirements, so the same atom can be scheduled, priced, and audited the same way on every project. XPMS 2.5 defines 406 canonical atoms. The ATLVS ecosystem seeds new organizations with the atom catalog as their starter task and asset vocabulary, and ties tasks and budget lines back to atoms.",
    ),
    aka: [
      t("marketing.glossaryContent.work-atom.aka.0", undefined, "canonical atom"),
      t("marketing.glossaryContent.work-atom.aka.1", undefined, "production atom"),
    ],
  }),
  "department-class": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.department-class.term", undefined, "Department Class"),
    short: t(
      "marketing.glossaryContent.department-class.short",
      undefined,
      "One of the 10 top-level XPMS divisions of production work, numbered 0000 Executive through 9000 Technology.",
    ),
    long: t(
      "marketing.glossaryContent.department-class.long",
      undefined,
      "Department classes are the 10 top-level divisions of production work in XPMS, numbered in thousands from 0000 Executive through 9000 Technology. Every discipline, work atom, and budget line rolls up to exactly one class, which lets a phase-by-department coordinate matrix, a GL code structure, and an org chart all share the same spine. The numbering doubles as a cost-center scheme, so finance and operations sort the same way without a mapping table. The ATLVS ecosystem seeds each organization's cost centers from the 10 XPMS department classes and maps position libraries and forecasting lenses onto them.",
    ),
    aka: [
      t("marketing.glossaryContent.department-class.aka.0", undefined, "department classes"),
      t("marketing.glossaryContent.department-class.aka.1", undefined, "10 departments"),
    ],
  }),
  "advance-packet": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.advance-packet.term", undefined, "Advance Packet"),
    short: t(
      "marketing.glossaryContent.advance-packet.short",
      undefined,
      "A scoped information packet sent to one counterparty during advancing, with a structured return expected against a deadline.",
    ),
    long: t(
      "marketing.glossaryContent.advance-packet.long",
      undefined,
      "An advance packet is the unit of exchange in a production advance: a scoped bundle of information going out to one counterparty (an artist team, a vendor, a delegation) and a structured submission expected back by a deadline. A packet carries only the sections that counterparty needs, such as technical requirements, travel, credentials, or safety, and the return comes back as structured rows the production can aggregate. In the ATLVS ecosystem, advance packets are composed per project, sent per recipient with a tracked delivery funnel from queued through submitted, and chased automatically as deadlines approach.",
    ),
    aka: [
      t("marketing.glossaryContent.advance-packet.aka.0", undefined, "advance pack"),
      t("marketing.glossaryContent.advance-packet.aka.1", undefined, "production advance packet"),
    ],
  }),
  "daily-log": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.daily-log.term", undefined, "Daily Log"),
    short: t(
      "marketing.glossaryContent.daily-log.short",
      undefined,
      "The per-day record of what happened on site: crew counts, work performed, deliveries, weather, and incidents.",
    ),
    long: t(
      "marketing.glossaryContent.daily-log.long",
      undefined,
      "A daily log is the running per-day record of a build or event site: headcount by trade, work performed, deliveries received, weather, delays, visitors, and any incidents. Construction sites have kept daily logs for decades because they settle disputes; when a schedule or payment argument surfaces months later, the log is the contemporaneous evidence. Live-event builds borrow the practice for load-in, show days, and strike. In the ATLVS ecosystem, daily logs are filed from the field on mobile and roll up to the project record alongside tasks and incident reports.",
    ),
    aka: [
      t("marketing.glossaryContent.daily-log.aka.0", undefined, "site diary"),
      t("marketing.glossaryContent.daily-log.aka.1", undefined, "daily report"),
    ],
  }),
  "shift-handover": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.shift-handover.term", undefined, "Shift Handover"),
    short: t(
      "marketing.glossaryContent.shift-handover.short",
      undefined,
      "The structured transfer of open items, risks, and site state from an outgoing shift to the incoming one.",
    ),
    long: t(
      "marketing.glossaryContent.shift-handover.long",
      undefined,
      "A shift handover is the controlled moment when one shift passes responsibility to the next: open items, in-progress work, active risks, radio channels, and anything the incoming lead must know before the outgoing lead walks. Around-the-clock operations (festival builds, 24-hour load-ins, security posts) live and die on handover quality, because most cross-shift failures trace to something the last shift knew and never wrote down. Strong handovers are structured and logged. In the ATLVS ecosystem, shift handovers are captured as structured field records tied to the shift, visible to the incoming crew before they clock in.",
    ),
    aka: [
      t("marketing.glossaryContent.shift-handover.aka.0", undefined, "shift change"),
      t("marketing.glossaryContent.shift-handover.aka.1", undefined, "handover report"),
    ],
  }),
  "chain-of-custody": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.chain-of-custody.term", undefined, "Chain of Custody"),
    short: t(
      "marketing.glossaryContent.chain-of-custody.short",
      undefined,
      "The documented, unbroken trail of who held an asset from checkout to return.",
    ),
    long: t(
      "marketing.glossaryContent.chain-of-custody.long",
      undefined,
      "Chain of custody is the documented trail of possession for an asset: who checked it out, when it moved, who signed at each transfer, and when it came back. The practice comes from evidence handling and applies wherever gear is valuable, regulated, or shared: radios, scanners, vehicles, tools, medical kits. A broken chain is how a two-thousand-dollar radio disappears with nobody accountable. In the ATLVS ecosystem, custody events are logged per asset as scans and signatures, so every transfer writes a journal row and the current holder is answerable in one query.",
    ),
    aka: [
      t("marketing.glossaryContent.chain-of-custody.aka.0", undefined, "custody trail"),
      t("marketing.glossaryContent.chain-of-custody.aka.1", undefined, "asset custody"),
    ],
  }),
  "site-ops": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.site-ops.term", undefined, "Site Ops"),
    short: t(
      "marketing.glossaryContent.site-ops.short",
      undefined,
      "The day-to-day operation of an event site: gates, power, water, waste, traffic, and everything that keeps the ground working.",
    ),
    long: t(
      "marketing.glossaryContent.site-ops.long",
      undefined,
      "Site ops, short for site operations, is the discipline of running the physical event site day to day: gates and perimeter, power and generators, water and waste, traffic and parking, weather monitoring, radios, and the dozens of small systems a site depends on. Site ops starts before load-in and ends after strike, and on multi-day events it runs around the clock. Where production builds the show, site ops keeps the ground under it working. In the ATLVS ecosystem, site ops runs through the COMPVSS field app: operational ledgers, shift coverage, and incident capture from anywhere on site.",
    ),
    aka: [
      t("marketing.glossaryContent.site-ops.aka.0", undefined, "site operations"),
      t("marketing.glossaryContent.site-ops.aka.1", undefined, "venue ops"),
    ],
  }),
  "deskless-workforce": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.deskless-workforce.term", undefined, "Deskless Workforce"),
    short: t(
      "marketing.glossaryContent.deskless-workforce.short",
      undefined,
      "Workers who do their jobs away from a desk: stagehands, riggers, security, medics, drivers, and stewards.",
    ),
    long: t(
      "marketing.glossaryContent.deskless-workforce.long",
      undefined,
      "The deskless workforce is the large majority of the global workforce that does not work at a desk; in live events, that means stagehands, riggers, security, medics, drivers, caterers, and stewards. Deskless workers rarely carry a company laptop or live in email, so tooling built for office workers fails them in the field; what works is mobile-first, offline-tolerant software with schedules, time clock, tasks, and comms in one place. The COMPVSS field app in the ATLVS ecosystem is built for exactly this population: an offline-first PWA where crew clock in, see shifts, file incidents, and read their event guide from a phone.",
    ),
    aka: [
      t("marketing.glossaryContent.deskless-workforce.aka.0", undefined, "field workforce"),
      t("marketing.glossaryContent.deskless-workforce.aka.1", undefined, "frontline workers"),
    ],
  }),
  "white-label": (e, t) => ({
    ...e,
    term: t("marketing.glossaryContent.white-label.term", undefined, "White-Label"),
    short: t(
      "marketing.glossaryContent.white-label.short",
      undefined,
      "Presenting stakeholder-facing surfaces under the organization's or event's own brand rather than the software vendor's.",
    ),
    long: t(
      "marketing.glossaryContent.white-label.long",
      undefined,
      "White-label is the practice of shipping stakeholder-facing surfaces (portals, documents, guides, booking pages) under the producing organization's or the event's own brand. Artists, vendors, and clients see the promoter's name and design, which reads as one professional operation and keeps trust where the relationship lives. White-labeling matters most on artifacts that leave the building: proposals, settlement sheets, advance packets, and guest guides. In the ATLVS ecosystem, documents and reports carry brand modes for org and client white-labeling, and portal surfaces render under event branding.",
    ),
    aka: [
      t("marketing.glossaryContent.white-label.aka.0", undefined, "white labeling"),
      t("marketing.glossaryContent.white-label.aka.1", undefined, "branded portal"),
    ],
  }),
};

const CATEGORY_LABELS: Record<string, (t: Translator) => string> = {
  standard: (t) => t("marketing.glossaryContent.categories.standard", undefined, "The Standard (XPMS)"),
  scheduling: (t) => t("marketing.glossaryContent.categories.scheduling", undefined, "Scheduling + ROS"),
  advancing: (t) => t("marketing.glossaryContent.categories.advancing", undefined, "Advancing"),
  credentials: (t) => t("marketing.glossaryContent.categories.credentials", undefined, "Credentials"),
  rigging: (t) => t("marketing.glossaryContent.categories.rigging", undefined, "Rigging"),
  production: (t) => t("marketing.glossaryContent.categories.production", undefined, "Production"),
  safety: (t) => t("marketing.glossaryContent.categories.safety", undefined, "Safety + HSE"),
  logistics: (t) => t("marketing.glossaryContent.categories.logistics", undefined, "Logistics"),
  finance: (t) => t("marketing.glossaryContent.categories.finance", undefined, "Finance"),
  tickets: (t) => t("marketing.glossaryContent.categories.tickets", undefined, "Tickets + Gates"),
  broadcast: (t) => t("marketing.glossaryContent.categories.broadcast", undefined, "Broadcast"),
};

const CATEGORY_TOKENS: Record<string, (t: Translator) => string> = {
  standard: (t) => t("marketing.glossaryContent.category-tokens.standard", undefined, "standard"),
  scheduling: (t) => t("marketing.glossaryContent.category-tokens.scheduling", undefined, "scheduling"),
  advancing: (t) => t("marketing.glossaryContent.category-tokens.advancing", undefined, "advancing"),
  credentials: (t) => t("marketing.glossaryContent.category-tokens.credentials", undefined, "credentials"),
  rigging: (t) => t("marketing.glossaryContent.category-tokens.rigging", undefined, "rigging"),
  production: (t) => t("marketing.glossaryContent.category-tokens.production", undefined, "production"),
  safety: (t) => t("marketing.glossaryContent.category-tokens.safety", undefined, "safety"),
  logistics: (t) => t("marketing.glossaryContent.category-tokens.logistics", undefined, "logistics"),
  finance: (t) => t("marketing.glossaryContent.category-tokens.finance", undefined, "finance"),
  tickets: (t) => t("marketing.glossaryContent.category-tokens.tickets", undefined, "tickets"),
  broadcast: (t) => t("marketing.glossaryContent.category-tokens.broadcast", undefined, "broadcast"),
};

/**
 * Localized view of GLOSSARY_BY_SLUG[slug]. Structure (slug, category,
 * related + module slug lists) rides through from the data file; term,
 * short, long, and aka resolve through the catalog and fall back to the
 * verbatim English copy.
 */
export function localizeGlossaryTerm(slug: string, t: Translator): GlossaryTerm | undefined {
  const e = GLOSSARY_BY_SLUG[slug];
  if (!e) return undefined;
  const loc = LOCALIZERS[slug];
  return loc ? loc(e, t) : e;
}

/** Localized section label for a GLOSSARY_CATEGORIES entry (index page). */
export function localizeGlossaryCategoryLabel(slug: string, t: Translator): string | undefined {
  return CATEGORY_LABELS[slug]?.(t);
}

/** Localized inline category token for the detail-page eyebrow. */
export function localizeGlossaryCategoryToken(slug: string, t: Translator): string | undefined {
  return CATEGORY_TOKENS[slug]?.(t);
}
