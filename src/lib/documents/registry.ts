/**
 * V6 Documents registry — all 29 document types from the v6.2 kit, expressed as
 * token-driven template descriptors over the shared DocEngine. Each template
 * is BOTH the on-screen view and the print/PDF artifact, carries the
 * `data-path` merge contract, and supports the 3 white-label brand modes.
 *
 * Flagships (proposal, invoice, callSheet, certificate) mirror the kit's built
 * reference templates field-for-field; the rest follow the same primitives +
 * the document's canonical sections. Sample values are illustrative — the
 * `data-path` on each merge field is the contract an integration / the record
 * store fills against.
 */
import type { DocTemplate } from "@/components/documents/DocEngine";

const mf = (path: string, value: string) => ({ path, value });

export const DOC_TEMPLATES: DocTemplate[] = [
  // ── ATLVS ────────────────────────────────────────────────────────────────
  {
    id: "proposal",
    title: "Proposal & SOW",
    app: "atlvs",
    schema: "proposal",
    blocks: [
      {
        kind: "cover",
        doctype: "Proposal & Statement of Work",
        title: mf("project.title", "Nike × Men's World Cup 2026 — Base Camp Fabrication"),
        sub: mf("project.objective", "Full fabricated + printed scope across the recovery, strength, mental-performance, coaching, and medical activation sites."),
        stamps: [
          { k: "Client", v: mf("client.name", "Acme Live") },
          { k: "Issued", v: mf("issuedAt", "2026-06-15"), mono: true },
          { k: "Proposal", v: mf("project.id", "PRJ-2049"), mono: true },
        ],
      },
      {
        kind: "section",
        eyebrow: "01 · Project Overview",
        heading: "The brief, charted.",
        paras: [
          [mf("client.name", "Acme Live"), " engaged ", mf("owner.org", "ATLVS"), " to deliver a ", mf("project.type", "festival mainstage"), " at ", mf("project.venue", "Bayfront Park"), "."],
          [mf("project.objective", "Full fabricated + printed scope across the recovery, strength, mental-performance, coaching, and medical activation sites.")],
          mf("narrative.0", "Our approach pairs in-house fabrication with on-site production services so a single team owns the work from shop drawing to strike."),
          mf("narrative.1", "Every environment is engineered for repeat deployment — built to travel, brand-accurate, and serviceable between activations."),
        ],
      },
      {
        kind: "section",
        eyebrow: "02 · Scope of Work",
        heading: "Every wall, fixture, and graphic.",
        table: {
          cols: [{ label: "Category" }, { label: "Scope item" }, { label: "Investment", align: "r" }],
          rows: [
            { cells: [mf("scope.0.category", "Fabrication & Print"), mf("scope.0.label", "Environmental structure & millwork"), mf("scope.0.amount", "$25,500")] },
            { cells: [mf("scope.1.category", "Production Services"), mf("scope.1.label", "Install & strike labor"), mf("scope.1.amount", "$35,500")] },
          ],
        },
      },
      {
        kind: "section",
        eyebrow: "03 · Activation Sites",
        heading: "Where it lives.",
        table: {
          cols: [{ label: "Site" }, { label: "Environment build" }],
          rows: [
            { cells: [mf("sites.0.name", "Recovery & Strength"), mf("sites.0.brief", "Speedrail framework, illuminated milk plexi, color-changing rails")] },
            { cells: [mf("sites.1.name", "Nike Mind"), mf("sites.1.brief", "Backlit perforated vent panels, dimensional logo, graphic inserts")] },
          ],
        },
      },
      {
        kind: "section",
        eyebrow: "04 · Production Lifecycle",
        heading: "Discovery through strike.",
        table: {
          cols: [{ label: "Phase" }, { label: "Focus" }, { label: "Gate" }],
          rows: [
            { cells: [mf("phases.0.name", "Discovery & Brief"), mf("phases.0.focus", "Creative brief & references"), mf("phases.0.gate", "Approved")] },
            { cells: [mf("phases.1.name", "Engineering & Development"), mf("phases.1.focus", "CAD, shop drawings, sampling"), mf("phases.1.gate", "In review")] },
          ],
        },
      },
      {
        kind: "section",
        eyebrow: "05 · Workback Schedule",
        heading: "Critical path.",
        table: {
          cols: [{ label: "Milestone" }, { label: "Phase" }, { label: "Date", align: "r" }],
          rows: [
            { cells: [mf("schedule.0.milestone", "Shop drawings approved"), mf("schedule.0.phase", "Design & Engineering"), mf("schedule.0.date", "2026-05-08")] },
            { cells: [mf("schedule.1.milestone", "Venue access · load-in"), mf("schedule.1.phase", "Install"), mf("schedule.1.date", "2026-05-26")] },
          ],
        },
      },
      {
        kind: "section",
        eyebrow: "06 · Investment Summary",
        heading: "Investment summary.",
        table: {
          cols: [{ label: "Workstream" }, { label: "" }, { label: "Investment", align: "r" }],
          rows: [
            { cells: [mf("invest.0.phase", "Fabrication & Print"), "", mf("invest.0.amount", "$105,000")] },
            { cells: [mf("invest.1.phase", "Production Services"), "", mf("invest.1.amount", "$70,000")] },
            { cells: ["Total project investment", "", mf("invest.total", "$175,000")], variant: "total" },
          ],
        },
      },
      {
        kind: "section",
        eyebrow: "07 · Engagement & Payment",
        heading: "Terms of engagement.",
        kv: {
          rows: [
            { k: "Deposit", v: [mf("payment.depositPct", "60%"), " · ", mf("payment.depositAmount", "$105,000"), " on signature"] },
            { k: "Balance", v: [mf("payment.balancePct", "40%"), " · ", mf("payment.balanceAmount", "$70,000"), " before load-in"] },
            { k: "Method", v: mf("payment.method", "ACH / wire") },
          ],
        },
      },
      {
        kind: "section",
        eyebrow: "08 · Change Orders",
        heading: "Optional scope.",
        table: {
          cols: [{ label: "Optional scope" }, { label: "Detail" }, { label: "Pricing", align: "r" }],
          rows: [
            { cells: [mf("changes.0.name", "Tier 2 material upgrade"), mf("changes.0.detail", "Premium finishes & hardware"), mf("changes.0.price", "On approval")] },
            { cells: [mf("changes.1.name", "Asset recovery & storage"), mf("changes.1.detail", "Long-term hold between activations"), mf("changes.1.price", "$4,500/yr")] },
          ],
        },
      },
      {
        kind: "section",
        eyebrow: "09 · Exclusions",
        heading: "Out of scope.",
        paras: [
          mf("exclusions.0", "Equipment. AV, lighting, and rigging hardware are rental or venue-provided."),
          mf("exclusions.1", "Travel & lodging. Crew travel is billed at cost via change order."),
        ],
      },
      {
        kind: "section",
        eyebrow: "10 · Terms & Conditions",
        heading: "Agreement.",
        table: {
          cols: [{ label: "Clause" }, { label: "Terms" }],
          rows: [
            { cells: [mf("terms.0.title", "Acceptance"), mf("terms.0.body", "Written approval of this SOW constitutes authorization to proceed.")] },
            { cells: [mf("terms.1.title", "Payment"), mf("terms.1.body", "60% deposit on signature; 40% balance before load-in. ACH/wire only.")] },
          ],
        },
      },
      { kind: "sign", rows: [{ label: "Client — signature / date" }, { label: "ATLVS — signature / date" }] },
      { kind: "foot", text: "Confidential" },
    ],
  },
  {
    id: "invoice",
    title: "Invoice",
    app: "atlvs",
    schema: "invoice",
    blocks: [
      { kind: "head", doctype: "Invoice", docno: mf("invoice.number", "INV-2049-03") },
      {
        kind: "section",
        kv: {
          rows: [
            { k: "Bill to", v: mf("client.name", "Acme Live") },
            { k: "Email", v: mf("client.email", "ap@acmelive.com") },
            { k: "Issued", v: mf("invoice.issuedAt", "2026-06-15") },
            { k: "Due", v: mf("invoice.dueAt", "2026-07-15") },
          ],
        },
      },
      {
        kind: "section",
        table: {
          cols: [{ label: "Description" }, { label: "Qty", align: "r" }, { label: "Rate", align: "r" }, { label: "Amount", align: "r" }],
          rows: [
            { cells: [mf("invoice.lines.0.desc", "Deposit — 60%"), "1", mf("invoice.lines.0.rate", "$204,048"), mf("invoice.lines.0.amount", "$204,048")] },
            { cells: ["Subtotal", "", "", mf("invoice.subtotal", "$204,048")], variant: "sub" },
            { cells: ["Tax", "", mf("invoice.taxRate", "0%"), mf("invoice.tax", "$0")] },
            { cells: ["Balance due", "", "", mf("invoice.balance", "$204,048")], variant: "total" },
          ],
        },
      },
      {
        kind: "section",
        eyebrow: "Payment terms",
        paras: [["Net ", mf("invoice.netDays", "30"), ". Late fee ", mf("invoice.lateFee", "1.5%/mo"), ". Remit to ", mf("owner.email", "ar@atlvs.pro"), "."]],
      },
      { kind: "foot", text: "Thank you" },
    ],
  },
  {
    id: "quote",
    title: "Quote / Estimate",
    app: "atlvs",
    schema: "quote",
    blocks: [
      { kind: "head", doctype: "Quote", docno: mf("quote.number", "QUO-2050") },
      { kind: "section", kv: { rows: [{ k: "Prepared for", v: mf("client.name", "Acme Live") }, { k: "Valid until", v: mf("quote.validUntil", "2026-07-01") }] } },
      {
        kind: "section",
        table: {
          cols: [{ label: "Line" }, { label: "Qty", align: "r" }, { label: "Unit", align: "r" }, { label: "Amount", align: "r" }],
          rows: [
            { cells: [mf("quote.lines.0.desc", "Stage & rigging"), "1", "$120,000", mf("quote.lines.0.amount", "$120,000")] },
            { cells: ["Estimated total", "", "", mf("quote.total", "$120,000")], variant: "total" },
          ],
        },
      },
      { kind: "foot", text: "Estimate — not a tax invoice" },
    ],
  },
  {
    id: "receipt",
    title: "Receipt",
    app: "atlvs",
    schema: "receipt",
    blocks: [
      { kind: "head", doctype: "Receipt", docno: mf("receipt.number", "RCT-9931") },
      {
        kind: "section",
        kv: {
          rows: [
            { k: "Paid by", v: mf("client.name", "Acme Live") },
            { k: "Method", v: mf("receipt.method", "ACH") },
            { k: "Date", v: mf("receipt.paidAt", "2026-06-16") },
            { k: "Amount", v: mf("receipt.amount", "$204,048") },
          ],
        },
      },
      { kind: "foot", text: "Payment received in full" },
    ],
  },
  {
    id: "purchaseorder",
    title: "Purchase Order",
    app: "atlvs",
    schema: "purchaseOrder",
    blocks: [
      { kind: "head", doctype: "Purchase Order", docno: mf("po.number", "PO-4821") },
      { kind: "section", kv: { rows: [{ k: "Vendor", v: mf("vendor.name", "Stagecraft Rentals") }, { k: "Ship to", v: mf("po.shipTo", "Bayfront Park") }, { k: "Need by", v: mf("po.needBy", "2026-08-01") }] } },
      {
        kind: "section",
        table: {
          cols: [{ label: "Item" }, { label: "Qty", align: "r" }, { label: "Unit", align: "r" }, { label: "Amount", align: "r" }],
          rows: [
            { cells: [mf("po.lines.0.desc", "Line array — 24 box"), mf("po.lines.0.qty", "2"), "$18,000", mf("po.lines.0.amount", "$36,000")] },
            { cells: ["Total", "", "", mf("po.total", "$36,000")], variant: "total" },
          ],
        },
      },
      { kind: "sign", rows: [{ label: "Authorized by — signature / date" }, { label: "Vendor — acknowledgement / date" }] },
      { kind: "foot", text: "PO terms apply" },
    ],
  },
  {
    id: "changeorder",
    title: "Change Order",
    app: "atlvs",
    schema: "changeOrder",
    blocks: [
      { kind: "head", doctype: "Change Order", docno: mf("co.number", "CO-12") },
      { kind: "section", eyebrow: "Scope change", heading: "What changed.", paras: [mf("co.summary", "Add a second delay tower and 40A distro.")] },
      {
        kind: "section",
        table: {
          cols: [{ label: "Description" }, { label: "Delta", align: "r" }],
          rows: [
            { cells: [mf("co.lines.0.desc", "Delay tower"), mf("co.lines.0.amount", "+$8,400")] },
            { cells: ["Net change", mf("co.total", "+$8,400")], variant: "total" },
          ],
        },
      },
      { kind: "sign", rows: [{ label: "Client — approval / date" }, { label: "ATLVS — approval / date" }] },
      { kind: "foot", text: "Change order" },
    ],
  },
  {
    id: "budget",
    title: "Budget",
    app: "atlvs",
    schema: "budget",
    size: "wide",
    blocks: [
      { kind: "head", doctype: "Budget", docno: mf("budget.version", "v3 — baselined") },
      {
        kind: "section",
        table: {
          cols: [{ label: "Phase" }, { label: "Budget", align: "r" }, { label: "Committed", align: "r" }, { label: "Actual", align: "r" }, { label: "Variance", align: "r" }],
          rows: [
            { cells: [mf("budget.0.phase", "Design"), "$48,000", "$44,000", "$43,200", "+$4,800"] },
            { cells: ["Total", mf("budget.total", "$340,080"), "$312,000", "$201,400", "+$28,080"], variant: "total" },
          ],
        },
      },
      { kind: "foot", text: "Budget — confidential" },
    ],
  },
  {
    id: "offerletter",
    title: "Offer Letter",
    app: "atlvs",
    schema: "offerLetter",
    blocks: [
      { kind: "head", doctype: "Offer Letter", docno: mf("offer.id", "OL-771") },
      {
        kind: "section",
        eyebrow: "Engagement",
        heading: "Offer of engagement.",
        paras: [
          ["Dear ", mf("candidate.name", "Dana Lin"), ","],
          ["On behalf of ", mf("offer.employer", "ATLVS Technologies"), ", we are pleased to offer you the role of ", mf("offer.role", "Lighting Designer"), " on ", mf("offer.project", "Miami Music Week"), ". Full engagement terms are set out below — countersign at the bottom to make it official."],
        ],
      },
      {
        kind: "section",
        eyebrow: "01 · Engagement Summary",
        heading: "Role & assignment.",
        kv: {
          rows: [
            { k: "Role", v: mf("offer.role", "Lighting Designer") },
            { k: "Department", v: mf("offer.department", "Lighting") },
            { k: "Classification", v: mf("offer.classification", "1099 Independent Contractor") },
            { k: "Reports to", v: mf("offer.reportsTo", "M. Soto · Production Manager") },
            { k: "Work location", v: mf("offer.workLocation", "Bayfront Park · Miami · FL") },
          ],
        },
      },
      {
        kind: "section",
        eyebrow: "02 · Engagement Window",
        heading: "Dates.",
        table: {
          cols: [{ label: "Milestone" }, { label: "Date", align: "r" }],
          rows: [
            { cells: ["Travel in", mf("dates.travelIn", "August 2, 2026")] },
            { cells: ["On-site start", mf("dates.onsiteStart", "August 4, 2026")] },
            { cells: ["On-site end", mf("dates.onsiteEnd", "August 9, 2026")] },
            { cells: ["Travel out", mf("dates.travelOut", "August 10, 2026")] },
            { cells: ["Projected service days", mf("offer.days", "6")], variant: "total" },
          ],
        },
      },
      {
        kind: "section",
        eyebrow: "03 · Compensation",
        heading: "Compensation & reimbursement.",
        kv: {
          rows: [
            { k: "Basis", v: mf("comp.basis", "Per Day") },
            { k: "Compensation", v: mf("comp.amount", "$650 per documented service-day deliverable") },
            { k: "Travel + lodging", v: mf("comp.reimbursement", "Pre-approved travel and lodging reimbursed against documented receipts") },
            { k: "Payment schedule", v: mf("comp.paymentSchedule", "Net 30 on accepted deliverables") },
          ],
        },
      },
      {
        kind: "section",
        eyebrow: "04 · Inclusions",
        heading: "What's included.",
        paras: [
          mf("inclusions.0", "Crew meals on call days"),
          mf("inclusions.1", "Travel provided / arranged"),
        ],
      },
      {
        kind: "section",
        eyebrow: "05 · Acceptance",
        heading: "Countersign to accept.",
        paras: [
          ["This offer is extended by ", mf("signer.name", "Julian Clarkson"), ", ", mf("signer.title", "Producer & Operations Director"), ". Type your full legal name below to formalize acceptance; your typed signature, IP address, and timestamp are captured as the audit trail."],
        ],
      },
      { kind: "sign", rows: [{ label: "Candidate — signature / date" }, { label: "ATLVS — signature / date" }] },
      { kind: "foot", text: "Confidential offer" },
    ],
  },
  {
    id: "agreement",
    title: "Agreement",
    app: "atlvs",
    schema: "agreement",
    blocks: [
      { kind: "head", doctype: "Agreement", docno: mf("agreement.id", "AGR-330") },
      { kind: "section", eyebrow: "Parties", heading: "This agreement.", paras: [["Between ", mf("owner.org", "ATLVS"), " and ", mf("party.name", "Acme Live"), ", effective ", mf("agreement.effectiveAt", "2026-06-15"), "."]] },
      { kind: "section", eyebrow: "Terms", heading: "Terms & conditions.", paras: [mf("agreement.terms", "Standard master services terms apply.")] },
      { kind: "sign", rows: [{ label: "Party A — signature / date" }, { label: "Party B — signature / date" }] },
      { kind: "foot", text: "Executed agreement" },
    ],
  },
  {
    id: "vendoragreement",
    title: "Vendor Agreement",
    app: "atlvs",
    schema: "vendorAgreement",
    blocks: [
      { kind: "head", doctype: "Vendor Agreement", docno: mf("va.id", "VA-118") },
      { kind: "section", eyebrow: "Vendor", heading: "Engagement terms.", paras: [["Vendor ", mf("vendor.name", "Stagecraft Rentals"), " (W-9 ", mf("vendor.w9", "on file"), ", COI exp ", mf("vendor.coiExpires", "2027-01-01"), ")."]] },
      { kind: "sign", rows: [{ label: "Vendor — signature / date" }, { label: "ATLVS — signature / date" }] },
      { kind: "foot", text: "Vendor agreement" },
    ],
  },
  {
    id: "recap",
    title: "Show Recap",
    app: "atlvs",
    schema: "recap",
    blocks: [
      { kind: "cover", accent: true, doctype: "Show Recap", title: mf("event.name", "Miami Music Week"), sub: mf("recap.headline", "12,400 attendees · 0 lost-time incidents."), stamps: [{ k: "Date", v: mf("event.date", "2026-08-04"), mono: true }, { k: "Venue", v: mf("site.name", "Bayfront Park") }, { k: "Attendance", v: mf("recap.attendance", "12,400"), mono: true }] },
      { kind: "section", eyebrow: "Outcomes", heading: "How it went.", paras: [mf("recap.summary", "Doors on time, peak concurrency at 21:40, strike complete by 03:00.")] },
      { kind: "foot", text: "Post-show recap" },
    ],
  },
  // ── COMPVSS ────────────────────────────────────────────────────────────────
  {
    id: "callsheet",
    title: "Call Sheet",
    app: "compvss",
    schema: "callSheet",
    blocks: [
      { kind: "cover", accent: true, doctype: "Call Sheet", title: mf("event.name", "Miami Music Week"), sub: mf("day.date", "Show Day — 2026-08-04"), stamps: [{ k: "General call", v: mf("day.generalCall", "06:00"), mono: true }, { k: "Doors", v: mf("day.doors", "18:00"), mono: true }, { k: "Curfew", v: mf("day.curfew", "23:00"), mono: true }] },
      { kind: "section", eyebrow: "Site", heading: "Where & who.", kv: { rows: [{ k: "Site", v: mf("site.name", "Bayfront Park") }, { k: "Address", v: mf("site.address", "301 Biscayne Blvd") }, { k: "Site lead", v: mf("site.lead", "R. Vega") }, { k: "Nearest hospital", v: mf("site.hospital", "Jackson Memorial") }] } },
      {
        kind: "section",
        eyebrow: "Department calls",
        table: {
          cols: [{ label: "Department" }, { label: "Call" }, { label: "Crew", align: "r" }, { label: "Lead · contact" }],
          rows: [
            { cells: ["Rigging", mf("calls.rigging", "06:00"), "8", "M. Soto"] },
            { cells: ["Lighting", mf("calls.lighting", "08:00"), "6", "D. Lin"] },
            { cells: ["Audio", mf("calls.audio", "09:00"), "5", "K. Park"] },
          ],
        },
      },
      { kind: "foot", text: "Call sheet" },
    ],
  },
  {
    id: "roster",
    title: "Crew Roster",
    app: "compvss",
    schema: "roster",
    size: "wide",
    blocks: [
      { kind: "head", doctype: "Crew Roster", docno: mf("event.name", "MMW — Crew") },
      {
        kind: "section",
        table: {
          cols: [{ label: "Name" }, { label: "Role" }, { label: "Dept" }, { label: "Call" }, { label: "Cert" }, { label: "Contact" }],
          rows: [
            { cells: [mf("roster.0.name", "Dana Lin"), "LD", "Lighting", "08:00", "ETCP", "555-0101"] },
            { cells: [mf("roster.1.name", "M. Soto"), "Rigger", "Rigging", "06:00", "ETCP-R", "555-0102"] },
          ],
        },
      },
      { kind: "foot", text: "Crew roster" },
    ],
  },
  {
    id: "schedule",
    title: "Production Schedule",
    app: "compvss",
    schema: "schedule",
    size: "wide",
    blocks: [
      { kind: "head", doctype: "Production Schedule", docno: mf("event.name", "MMW — Schedule") },
      {
        kind: "section",
        table: {
          cols: [{ label: "Time" }, { label: "Activity" }, { label: "Zone" }, { label: "Owner" }],
          rows: [
            { cells: [mf("sched.0.time", "06:00"), "Load-in begins", "Loading dock", "R. Vega"] },
            { cells: [mf("sched.1.time", "12:00"), "Rig flown", "Mainstage", "M. Soto"] },
          ],
        },
      },
      { kind: "foot", text: "Production schedule" },
    ],
  },
  {
    id: "runofshow",
    title: "Run of Show",
    app: "compvss",
    schema: "runOfShow",
    size: "wide",
    blocks: [
      { kind: "head", doctype: "Run of Show", docno: mf("event.name", "MMW — ROS") },
      {
        kind: "section",
        table: {
          cols: [{ label: "Cue" }, { label: "Time" }, { label: "Lane" }, { label: "Action" }, { label: "Caller" }],
          rows: [
            { cells: [mf("ros.0.cue", "Q1"), "20:00", "Show", "House to half", "SM"] },
            { cells: [mf("ros.1.cue", "Q2"), "20:02", "Audio", "Walk-in music out", "A1"] },
          ],
        },
      },
      { kind: "foot", text: "Run of show" },
    ],
  },
  {
    id: "pullsheet",
    title: "Pull Sheet",
    app: "compvss",
    schema: "pullSheet",
    blocks: [
      { kind: "head", doctype: "Pull Sheet", docno: mf("pull.id", "PULL-204") },
      {
        kind: "section",
        table: {
          cols: [{ label: "Asset" }, { label: "Qty", align: "r" }, { label: "From" }, { label: "Status" }],
          rows: [
            { cells: [mf("pull.0.asset", "SHURE ULXD ×8"), "8", "Cage A", "Pulled"] },
            { cells: [mf("pull.1.asset", "Cable 50ft XLR ×20"), "20", "Cage C", "Staged"] },
          ],
        },
      },
      { kind: "foot", text: "Pull sheet" },
    ],
  },
  {
    id: "timesheet",
    title: "Timesheet",
    app: "compvss",
    schema: "timesheet",
    blocks: [
      { kind: "head", doctype: "Timesheet", docno: mf("ts.period", "Wk 2026-W31") },
      { kind: "section", kv: { rows: [{ k: "Worker", v: mf("worker.name", "Dana Lin") }, { k: "Project", v: mf("project.id", "PRJ-2049") }, { k: "Total hours", v: mf("ts.totalHours", "46.5") }] } },
      {
        kind: "section",
        table: {
          cols: [{ label: "Date" }, { label: "In" }, { label: "Out" }, { label: "Break", align: "r" }, { label: "Hours", align: "r" }],
          rows: [{ cells: [mf("ts.0.date", "2026-08-04"), "06:00", "20:30", "0.5", mf("ts.0.hours", "14.0")] }],
        },
      },
      { kind: "sign", rows: [{ label: "Worker — signature / date" }, { label: "Approver — signature / date" }] },
      { kind: "foot", text: "Timesheet" },
    ],
  },
  {
    id: "incident",
    title: "Incident Report",
    app: "compvss",
    schema: "incident",
    blocks: [
      { kind: "head", doctype: "Incident Report", docno: mf("incident.id", "INC-0044") },
      { kind: "section", eyebrow: "Summary", heading: "What happened.", paras: [["At ", mf("incident.at", "2026-08-04 14:20"), " in ", mf("incident.zone", "Backstage"), ": ", mf("incident.summary", "Minor laceration, first-aid administered.")]] },
      { kind: "section", kv: { rows: [{ k: "Severity", v: mf("incident.severity", "Minor") }, { k: "Reporter", v: mf("incident.reporter", "R. Vega") }, { k: "Status", v: mf("incident.state", "Closed") }] } },
      { kind: "sign", rows: [{ label: "Reporter — signature / date" }, { label: "Safety officer — signature / date" }] },
      { kind: "foot", text: "Incident report — confidential" },
    ],
  },
  {
    id: "inspection",
    title: "Inspection",
    app: "compvss",
    schema: "inspection",
    blocks: [
      { kind: "head", doctype: "Inspection", docno: mf("inspection.id", "INS-209") },
      {
        kind: "section",
        table: {
          cols: [{ label: "Item" }, { label: "Result" }, { label: "Note" }],
          rows: [
            { cells: [mf("inspection.0.item", "Rigging points"), "Pass", "Torqued & tagged"] },
            { cells: [mf("inspection.1.item", "Egress paths"), "Pass", "Clear"] },
          ],
        },
      },
      { kind: "sign", rows: [{ label: "Inspector — signature / date" }, { label: "Approver — signature / date" }] },
      { kind: "foot", text: "Inspection record" },
    ],
  },
  {
    id: "rams",
    title: "RAMS",
    app: "compvss",
    schema: "rams",
    blocks: [
      { kind: "cover", doctype: "Risk Assessment & Method Statement", title: mf("rams.title", "Rigging — Mainstage"), sub: mf("rams.scope", "Overhead rigging, motors, and ground support."), stamps: [{ k: "Rev", v: mf("rams.rev", "B"), mono: true }, { k: "Assessor", v: mf("rams.assessor", "M. Soto") }, { k: "Date", v: mf("rams.date", "2026-07-28"), mono: true }] },
      {
        kind: "section",
        eyebrow: "Risk assessment",
        table: {
          cols: [{ label: "Hazard" }, { label: "Risk" }, { label: "Control" }],
          rows: [{ cells: [mf("rams.0.hazard", "Falling objects"), "High", "Exclusion zone + hard hats"] }],
        },
      },
      { kind: "section", eyebrow: "Method statement", heading: "Safe system of work.", paras: [mf("rams.method", "Flown in sequence per the rig plot; competent persons only.")] },
      { kind: "foot", text: "RAMS" },
    ],
  },
  {
    id: "sop",
    title: "SOP",
    app: "compvss",
    schema: "sop",
    blocks: [
      { kind: "head", doctype: "Standard Operating Procedure", docno: mf("sop.id", "SOP-014") },
      { kind: "section", eyebrow: "Purpose", heading: mf("sop.title", "Crowd surge response") },
      {
        kind: "section",
        eyebrow: "Procedure",
        phase: [
          { n: "1", title: "Detect", body: mf("sop.0", "Spotters call density on the radio net.") },
          { n: "2", title: "Hold", body: mf("sop.1", "Pause ingress; open relief gates.") },
        ],
      },
      { kind: "foot", text: "SOP" },
    ],
  },
  {
    id: "itinerary",
    title: "Travel Itinerary",
    app: "compvss",
    schema: "itinerary",
    blocks: [
      { kind: "head", doctype: "Itinerary", docno: mf("traveler.name", "Dana Lin") },
      {
        kind: "section",
        kv: {
          cols: 3,
          rows: [
            { k: "Traveler", v: mf("traveler.name", "Dana Lin") },
            { k: "Event", v: mf("event.name", "EDC Orlando") },
            { k: "Confirmation", v: mf("itinerary.conf", "EDC-DL") },
          ],
        },
      },
      {
        kind: "section",
        eyebrow: "Itinerary",
        phase: [
          { n: "1", title: "Outbound", body: mf("leg.outbound", "MIA → MCO · AA 1142") },
          { n: "2", title: "Ground", body: mf("leg.ground", "Crew shuttle · MCO → hotel") },
          { n: "3", title: "Lodging", body: mf("leg.hotel", "Rosen Plaza · rm 412") },
          { n: "4", title: "Per diem", body: ["$", mf("perDiem.rate", "65"), "/day · $", mf("perDiem.total", "260"), " total"] },
          { n: "5", title: "Return", body: mf("leg.return", "MCO → MIA · AA 1190") },
        ],
      },
      { kind: "foot", text: ["Itinerary · ", mf("traveler.name", "Dana Lin"), " · ", mf("event.name", "EDC Orlando")] },
    ],
  },
  {
    id: "staffing",
    title: "Staffing Plan",
    app: "compvss",
    schema: "staffing",
    size: "wide",
    blocks: [
      { kind: "head", doctype: "Staffing Plan", docno: mf("project.id", "RRR-052") },
      {
        kind: "section",
        kv: {
          cols: 3,
          rows: [
            { k: "Project", v: mf("event.name", "Salvage City") },
            { k: "Filled", v: mf("staffing.filled", "38 / 44") },
            { k: "Coordinator", v: mf("coordinator", "M. Adeyemi") },
          ],
        },
      },
      {
        kind: "section",
        table: {
          cols: [{ label: "Position" }, { label: "Qty", align: "r" }, { label: "Required cert" }, { label: "Assigned" }, { label: "State" }],
          rows: [
            { cells: [mf("staffing.0.position", "Rigger L1"), "2", "ETCP", mf("staffing.0.assigned", "D. Lin, +1"), mf("staffing.0.state", "Accepted")] },
            { cells: [mf("staffing.1.position", "LD / Elec"), "1", "ESTA", mf("staffing.1.assigned", "R. Vega"), mf("staffing.1.state", "Offered")] },
            { cells: ["Total positions", mf("staffing.total", "44"), "", "", mf("staffing.summary", "38 filled")], variant: "total" },
          ],
        },
      },
      { kind: "foot", text: ["Staffing plan · ", mf("event.name", "Salvage City"), " · ", mf("project.id", "RRR-052")] },
    ],
  },
  // ── GVTEWAY ────────────────────────────────────────────────────────────────
  {
    id: "ticket",
    title: "Ticket",
    app: "gvteway",
    schema: "ticket",
    blocks: [
      { kind: "cover", accent: true, doctype: "Ticket", title: mf("event.name", "Miami Music Week"), sub: mf("ticket.tier", "GA · Day 1"), stamps: [{ k: "Holder", v: mf("holder.name", "Sam Rivera") }, { k: "Seat", v: mf("ticket.seat", "GA") }, { k: "Code", v: mf("ticket.code", "MMW-8F2A-1147"), mono: true }] },
      { kind: "section", kv: { rows: [{ k: "Date", v: mf("event.date", "2026-08-04") }, { k: "Doors", v: mf("event.doors", "18:00") }, { k: "Venue", v: mf("site.name", "Bayfront Park") }] } },
      { kind: "foot", text: "Admit one — non-transferable" },
    ],
  },
  {
    id: "guestlist",
    title: "Guest List",
    app: "gvteway",
    schema: "guestList",
    size: "wide",
    blocks: [
      { kind: "head", doctype: "Guest List", docno: mf("event.name", "MMW — VIP") },
      {
        kind: "section",
        table: {
          cols: [{ label: "Name" }, { label: "Party", align: "r" }, { label: "List" }, { label: "Comp" }, { label: "Status" }],
          rows: [{ cells: [mf("guests.0.name", "J. Cole"), "2", "Artist", "Yes", "Checked-in"] }],
        },
      },
      { kind: "foot", text: "Guest list — door use only" },
    ],
  },
  // ── LEG3ND ──────────────────────────────────────────────────────────────────
  {
    id: "certificate",
    title: "Certificate",
    app: "legend",
    schema: "certificate",
    blocks: [
      { kind: "cover", accent: true, doctype: "Certificate of Completion", title: mf("holder.name", "Dana Lin"), sub: mf("course.title", "Advanced Rigging Safety"), stamps: [{ k: "Issued", v: mf("issuedAt", "2026-06-15"), mono: true }, { k: "Credential", v: mf("credentialId", "LEG-RIG-7741"), mono: true }, { k: "Expires", v: mf("expiresAt", "2028-06-15"), mono: true }] },
      { kind: "section", paras: [mf("course.summary", "Has demonstrated competency in overhead rigging, load calculation, and inspection.")], kv: { rows: [{ k: "Instructor", v: mf("instructor.name", "M. Soto") }, { k: "CEUs", v: mf("ceus", "1.2") }] } },
      { kind: "foot", text: "Verify at legend.atlvs.pro" },
    ],
  },
  {
    id: "syllabus",
    title: "Course Syllabus",
    app: "legend",
    schema: "syllabus",
    blocks: [
      { kind: "head", doctype: "Course Syllabus", docno: mf("course.code", "RIG-201") },
      { kind: "section", heading: mf("course.title", "Advanced Rigging Safety"), paras: [mf("course.summary", "12-module program with practical assessment.")] },
      {
        kind: "section",
        eyebrow: "Modules",
        phase: [
          { n: "1", title: "Load fundamentals", body: mf("modules.0", "WLL, dynamic vs static loads.") },
          { n: "2", title: "Inspection", body: mf("modules.1", "Daily + periodic inspection regimes.") },
        ],
      },
      { kind: "foot", text: "LEG3ND · The Standard" },
    ],
  },
  {
    id: "transcript",
    title: "Transcript",
    app: "legend",
    schema: "transcript",
    blocks: [
      { kind: "head", doctype: "Transcript", docno: mf("holder.name", "Dana Lin") },
      {
        kind: "section",
        table: {
          cols: [{ label: "Course" }, { label: "Completed" }, { label: "Score", align: "r" }, { label: "CEUs", align: "r" }],
          rows: [
            { cells: [mf("transcript.0.course", "Advanced Rigging Safety"), "2026-06-15", "96%", "1.2"] },
            { cells: ["Total CEUs", "", "", mf("transcript.totalCeus", "4.8")], variant: "total" },
          ],
        },
      },
      { kind: "foot", text: "Official transcript" },
    ],
  },
  {
    id: "erp",
    title: "Emergency Response Plan",
    app: "legend",
    schema: "erp",
    blocks: [
      { kind: "cover", doctype: "Emergency Response Plan", title: mf("event.name", "Miami Music Week"), sub: mf("erp.scope", "Severe weather, medical, and evacuation procedures."), stamps: [{ k: "Rev", v: mf("erp.rev", "C"), mono: true }, { k: "Approved", v: mf("erp.approver", "Safety Director") }, { k: "Date", v: mf("erp.date", "2026-07-30"), mono: true }] },
      { kind: "section", eyebrow: "Evacuation", heading: "If the site must clear.", paras: [mf("erp.evac", "Stop show, houselights up, PA announcement, route to muster points A–D.")] },
      { kind: "section", eyebrow: "Contacts", kv: { rows: [{ k: "Incident commander", v: mf("erp.ic", "555-0199") }, { k: "Nearest hospital", v: mf("site.hospital", "Jackson Memorial") }] } },
      { kind: "foot", text: "Emergency response plan" },
    ],
  },
];

export function getDocTemplate(id: string): DocTemplate | undefined {
  return DOC_TEMPLATES.find((t) => t.id === id);
}

export const DOC_TEMPLATES_BY_APP: Record<string, DocTemplate[]> = DOC_TEMPLATES.reduce(
  (acc, t) => {
    (acc[t.app] ??= []).push(t);
    return acc;
  },
  {} as Record<string, DocTemplate[]>,
);
