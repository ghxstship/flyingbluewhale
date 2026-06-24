import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { OrgBrand, ClientBrand } from "@/components/documents/DocEngine";
import { formatMoney, formatDate } from "@/lib/i18n/format";
import { partitionBlocks } from "@/lib/proposals/validate";
import { proposalDataFromBlocks } from "./proposal-binding";
import { offerLetterData } from "./offer-binding";
import type { OfferLetterResolved } from "@/lib/offer-letters/types";
import { loadInvoiceArtifact } from "./sources/invoice";
import { resolveDepositPct, PROPOSAL_DEPOSIT_PCT_DEFAULT } from "@/lib/payment-terms";

/**
 * Internal data resolvers — map a real org-scoped record to the merge-field
 * data object a document template fills against (keyed by the template's
 * `data-path`s, see contract.ts). This is the INTERNAL generation path: given
 * a docType + record id, fetch the canonical row(s) and shape them so
 * `<DocRenderer data={...}>` renders the real document.
 *
 * Scope discipline: every query filters `org_id = orgId`; RLS is the actual
 * boundary, this is defense-in-depth. A resolver fills the cleanly-mappable
 * identity/party/amount/date fields; any field a template reads that the
 * schema doesn't carry simply falls back to the template's sample value (the
 * engine's resolve() handles that), so a partially-bound document is still
 * complete and correct — never broken.
 *
 * The EXTERNAL generation path (POST arbitrary data to the API) covers all 29
 * doc types unconditionally; record-binding is the internal convenience for
 * the doc types that map onto a backing table.
 */

type DB = Awaited<ReturnType<typeof createClient>>;
type DocData = Record<string, unknown>;

const money = (cents: number | string | null | undefined, currency?: string | null) =>
  formatMoney(cents == null ? null : Number(cents), currency ?? undefined);
const date = (d: string | null | undefined) => (d ? formatDate(d) : undefined);

/** A resolver returns the bound data object, or null when the record is absent. */
export type DocResolver = (db: DB, orgId: string, recordId: string) => Promise<DocData | null>;

const resolvers: Record<string, DocResolver> = {
  // ── ATLVS ────────────────────────────────────────────────────────────────
  async proposal(db, orgId, id) {
    const { data: p } = await db
      .from("proposals")
      .select("title, amount_cents, currency, deposit_percent, doc_number, sent_at, created_at, blocks, client_id, project_id")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!p) return null;
    const [{ data: client }, { data: org }] = await Promise.all([
      p.client_id ? db.from("clients").select("name").eq("id", p.client_id).maybeSingle() : noRow(),
      db.from("orgs").select("name, default_deposit_pct").eq("id", orgId).maybeSingle(),
    ]);
    // Map the rich builder document (proposals.blocks, System B) into the kit
    // template's merge fields, then layer identity/total defaults underneath —
    // block-derived values win where present, sample copy fills the rest.
    const { valid: blocks } = partitionBlocks(p.blocks);
    const bound = proposalDataFromBlocks(blocks, {
      currency: p.currency,
      // Per-instance proposal deposit → org template default → proposal system default.
      depositPercent: resolveDepositPct(p.deposit_percent, org?.default_deposit_pct, PROPOSAL_DEPOSIT_PCT_DEFAULT),
      amountCents: p.amount_cents,
    });
    const total = money(p.amount_cents, p.currency);
    return {
      ...bound,
      project: { title: p.title, id: p.doc_number, ...(bound.project as Record<string, unknown> | undefined) },
      client: { name: client?.name },
      owner: { org: org?.name },
      issuedAt: date(p.sent_at ?? p.created_at),
      invest: { total, ...(bound.invest as Record<string, unknown> | undefined) },
    };
  },

  async invoice(db, orgId, id) {
    // Shared loader is the single source of truth for invoice → artifact (the
    // react-pdf route reads the same rows); this resolver shapes them as the
    // kit document's merge fields.
    const loaded = await loadInvoiceArtifact(db, orgId, id);
    if (!loaded) return null;
    const { invoice: inv, lineItems, client, org } = loaded;
    const cur = inv.currency;
    return {
      invoice: {
        number: inv.number,
        issuedAt: date(inv.issued_at),
        dueAt: date(inv.due_at),
        subtotal: money(inv.amount_cents, cur),
        balance: money(inv.amount_cents, cur),
        lines: lineItems.map((l) => ({
          desc: l.description,
          rate: money(l.unit_price_cents, cur),
          amount: money(Number(l.unit_price_cents) * Number(l.quantity), cur),
        })),
      },
      client: { name: client?.name, email: client?.contact_email },
      owner: { email: org?.support_email },
    };
  },

  async quote(db, orgId, id) {
    const { data: est } = await db
      .from("estimates")
      .select("name, project_id, baseline_at, total_with_markup")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!est) return null;
    const [{ data: lines }, client, { data: org }] = await Promise.all([
      db.from("estimate_lines").select("description, line_total, ordinal").eq("estimate_id", id).order("ordinal", { ascending: true }),
      clientForProject(db, est.project_id),
      db.from("orgs").select("default_currency").eq("id", orgId).maybeSingle(),
    ]);
    // estimate_lines.line_total / estimates.total_with_markup are numeric(14,2)
    // MAJOR units (dollars); money() expects minor units (cents) — convert.
    const cur = org?.default_currency ?? undefined;
    const toCents = (n: number | string | null | undefined) => Math.round(Number(n ?? 0) * 100);
    return {
      quote: {
        number: est.name,
        validUntil: date(est.baseline_at),
        lines: (lines ?? []).map((l) => ({ desc: l.description, amount: money(toCents(l.line_total), cur) })),
        total: money(toCents(est.total_with_markup), cur),
      },
      client: { name: client?.name },
    };
  },

  async purchaseorder(db, orgId, id) {
    const { data: po } = await db
      .from("purchase_orders")
      .select("number, amount_cents, currency, vendor_id")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!po) return null;
    const [{ data: lines }, { data: vendor }] = await Promise.all([
      db
        .from("po_line_items")
        .select("description, quantity, unit_price_cents, position")
        .eq("purchase_order_id", id)
        .order("position", { ascending: true }),
      po.vendor_id ? db.from("vendors").select("name").eq("id", po.vendor_id).maybeSingle() : noRow(),
    ]);
    const cur = po.currency;
    return {
      po: {
        number: po.number,
        total: money(po.amount_cents, cur),
        lines: (lines ?? []).map((l) => ({
          desc: l.description,
          qty: String(l.quantity),
          amount: money(Number(l.unit_price_cents) * Number(l.quantity), cur),
        })),
      },
      vendor: { name: vendor?.name },
    };
  },

  async budget(db, orgId, projectId) {
    // A "budget" document is the per-project rollup of budget lines. Bind the
    // real Budget/Committed/Actual/Variance columns (no fabricated samples) —
    // first line as the example row, plus the column totals (plumb-line DOC-3).
    const { data: rows } = await db
      .from("budgets")
      .select("name, category, amount_cents, committed_cents, spent_cents, currency")
      .eq("org_id", orgId)
      .eq("project_id", projectId);
    if (!rows || rows.length === 0) return null;
    const cur = rows[0]?.currency;
    const budgetTotal = rows.reduce((n, r) => n + Number(r.amount_cents ?? 0), 0);
    const committedTotal = rows.reduce((n, r) => n + Number(r.committed_cents ?? 0), 0);
    const actualTotal = rows.reduce((n, r) => n + Number(r.spent_cents ?? 0), 0);
    const first = rows[0];
    if (!first) return null;
    return {
      budget: {
        "0": {
          phase: first.category ?? first.name,
          budget: money(first.amount_cents, cur),
          committed: money(first.committed_cents, cur),
          actual: money(first.spent_cents, cur),
          variance: money(Number(first.amount_cents ?? 0) - Number(first.spent_cents ?? 0), cur),
        },
        total: money(budgetTotal, cur),
        committedTotal: money(committedTotal, cur),
        actualTotal: money(actualTotal, cur),
        varianceTotal: money(budgetTotal - actualTotal, cur),
      },
    };
  },

  async offerletter(db, orgId, id) {
    // Bind from the resolved view (all SSOT joins applied) so role,
    // classification, comp, engagement-window, and inclusions render from the
    // real record — not the template sample. The offer-binding bridge is the
    // single mapper shared with the rich LetterDocument's source data.
    const { data: ol } = await db
      .from("offer_letters_resolved")
      .select("*")
      .eq("id", id)
      .eq("org_id", orgId)
      // View rows are generated all-nullable + Json — shape to the app contract.
      .returns<OfferLetterResolved[]>()
      .maybeSingle();
    if (!ol) return null;
    return offerLetterData(ol);
  },

  // ── COMPVSS ────────────────────────────────────────────────────────────────
  async callsheet(db, orgId, id) {
    const { data: cs } = await db
      .from("call_sheets")
      .select("title, event_date, call_time, venue")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!cs) return null;
    return {
      event: { name: cs.title },
      day: { date: date(cs.event_date), generalCall: cs.call_time },
      site: { name: cs.venue },
    };
  },

  async timesheet(db, orgId, id) {
    const { data: ts } = await db
      .from("timesheets")
      .select("period_start, period_end, total_minutes, project_id")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!ts) return null;
    const period = [date(ts.period_start), date(ts.period_end)].filter(Boolean).join(" – ");
    return {
      ts: {
        period: period || undefined,
        totalHours: ts.total_minutes != null ? (Number(ts.total_minutes) / 60).toFixed(1) : undefined,
      },
      project: { id: ts.project_id ? shortId(ts.project_id) : undefined },
    };
  },

  async incident(db, orgId, id) {
    const { data: inc } = await db
      .from("incidents")
      .select("id, summary, severity, incident_state, location, occurred_at")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!inc) return null;
    return {
      incident: {
        id: shortId(inc.id),
        summary: inc.summary,
        severity: inc.severity,
        state: inc.incident_state,
        zone: inc.location,
        at: date(inc.occurred_at),
      },
    };
  },

  async inspection(db, orgId, id) {
    const { data: ins } = await db
      .from("inspections")
      .select("id, code, name")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!ins) return null;
    const { data: items } = await db
      .from("inspection_items")
      .select("prompt, position")
      .eq("inspection_id", id)
      .order("position", { ascending: true });
    return {
      inspection: {
        id: ins.code ?? shortId(ins.id),
        ...Object.fromEntries((items ?? []).map((it, i) => [String(i), { item: it.prompt }])),
      },
    };
  },

  // ── GVTEWAY ────────────────────────────────────────────────────────────────
  async guestlist(db, orgId, id) {
    const { data: gl } = await db
      .from("guest_lists")
      .select("name")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!gl) return null;
    const { data: entries } = await db
      .from("guest_list_entries")
      .select("guest_name, created_at")
      .eq("guest_list_id", id)
      .order("created_at", { ascending: true });
    return {
      event: { name: gl.name },
      guests: (entries ?? []).map((e) => ({ name: e.guest_name })),
    };
  },

  // ── LEG3ND ──────────────────────────────────────────────────────────────────
  async certificate(db, orgId, id) {
    const { data: cred } = await db
      .from("credentials")
      .select("kind, number, issued_on, expires_on, crew_member_id")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!cred) return null;
    const { data: crew } = cred.crew_member_id
      ? await db.from("crew_members").select("name").eq("id", cred.crew_member_id).maybeSingle()
      : { data: null };
    return {
      holder: { name: crew?.name },
      course: { title: cred.kind },
      credentialId: cred.number,
      issuedAt: date(cred.issued_on),
      expiresAt: date(cred.expires_on),
    };
  },

  async syllabus(db, orgId, id) {
    const { data: course } = await db
      .from("courses")
      .select("title, summary")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!course) return null;
    const { data: lessons } = await db
      .from("course_lessons")
      .select("title, body, ordinal")
      .eq("course_id", id)
      .order("ordinal", { ascending: true });
    return {
      course: { title: course.title, summary: course.summary },
      modules: (lessons ?? []).map((l) => l.body ?? l.title),
    };
  },

  async receipt(db, orgId, id) {
    const { data: inv } = await db
      .from("invoices")
      .select("number, amount_cents, currency, paid_at, stripe_payment_intent, client_id")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!inv) return null;
    const { data: client } = inv.client_id
      ? await db.from("clients").select("name").eq("id", inv.client_id).maybeSingle()
      : { data: null };
    return {
      receipt: {
        number: inv.number,
        amount: money(inv.amount_cents, inv.currency),
        paidAt: date(inv.paid_at),
        method: inv.stripe_payment_intent ? "Card (Stripe)" : undefined,
      },
      client: { name: client?.name },
    };
  },

  async agreement(db, orgId, id) {
    const { data: c } = await db
      .from("contracts")
      .select("number, counterparty_name, start_date, description_md")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!c) return null;
    const { data: org } = await db.from("orgs").select("name").eq("id", orgId).maybeSingle();
    return {
      agreement: { id: c.number, effectiveAt: date(c.start_date), terms: c.description_md },
      owner: { org: org?.name },
      party: { name: c.counterparty_name },
    };
  },

  async vendoragreement(db, orgId, id) {
    const { data: c } = await db
      .from("contracts")
      .select("number, counterparty_name, vendor_id")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!c) return null;
    const { data: vendor } = c.vendor_id
      ? await db.from("vendors").select("name, w9_on_file, coi_expires_at").eq("id", c.vendor_id).maybeSingle()
      : { data: null };
    return {
      va: { id: c.number },
      vendor: {
        name: vendor?.name ?? c.counterparty_name,
        w9: vendor ? (vendor.w9_on_file ? "on file" : "not on file") : undefined,
        coiExpires: date(vendor?.coi_expires_at),
      },
    };
  },

  async roster(db, orgId, id) {
    const { data: r } = await db.from("rosters").select("name").eq("id", id).eq("org_id", orgId).maybeSingle();
    if (!r) return null;
    return { event: { name: r.name } };
  },

  async schedule(db, orgId, baselineId) {
    // Bound by schedule baseline; activities order by planned start.
    const { data: rows } = await db
      .from("schedule_activities")
      .select("name, start_planned")
      .eq("org_id", orgId)
      .eq("baseline_id", baselineId)
      .order("start_planned", { ascending: true });
    if (!rows || rows.length === 0) return null;
    return { sched: rows.map((a) => ({ time: date(a.start_planned), activity: a.name })) };
  },

  async pullsheet(db, orgId, projectId) {
    // A pull sheet is the equipment pulled for a project (its rentals).
    const { data: rentals } = await db
      .from("rentals")
      .select("equipment_id, created_at")
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    if (!rentals || rentals.length === 0) return null;
    const ids = rentals.map((r) => r.equipment_id).filter(Boolean) as string[];
    const { data: equip } = ids.length
      ? await db.from("equipment").select("id, name").in("id", ids)
      : { data: [] as { id: string; name: string }[] };
    const nameById = new Map((equip ?? []).map((e) => [e.id, e.name]));
    return {
      pull: {
        id: shortId(projectId),
        ...Object.fromEntries(rentals.map((r, i) => [String(i), { asset: nameById.get(r.equipment_id ?? "") }])),
      },
    };
  },

  async ticket(db, orgId, id) {
    const { data: a } = await db
      .from("assignments")
      .select("id, project_id, party_kind, party_user_id, party_crew_id, party_external_id")
      .eq("id", id)
      .eq("org_id", orgId)
      .eq("catalog_kind", "ticket")
      .maybeSingle();
    if (!a) return null;
    const [{ data: det }, { data: code }, holder, { data: project }] = await Promise.all([
      db
        .from("ticket_assignment_details")
        .select("tier_code, seat_section, seat_row, seat_number")
        .eq("assignment_id", id)
        .maybeSingle(),
      db.from("assignment_scan_codes").select("code").eq("assignment_id", id).eq("active", true).limit(1).maybeSingle(),
      ticketHolderName(db, a),
      a.project_id ? db.from("projects").select("name").eq("id", a.project_id).maybeSingle() : noRow(),
    ]);
    const seat = det
      ? [det.seat_section, det.seat_row, det.seat_number].filter(Boolean).join("-") || undefined
      : undefined;
    return {
      event: { name: project?.name },
      ticket: { tier: det?.tier_code, seat, code: code?.code },
      holder: { name: holder },
    };
  },

  async transcript(db, orgId, userId) {
    const { data: comps } = await db
      .from("course_completions")
      .select("course:courses(title, org_id), completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: true });
    const rows = (comps ?? []).filter((c) => {
      const course = c.course as { org_id?: string } | null;
      return course?.org_id === orgId;
    });
    if (rows.length === 0) return null;
    const { data: user } = await db.from("users").select("name").eq("id", userId).maybeSingle();
    return {
      holder: { name: user?.name },
      transcript: rows.map((c) => ({ course: (c.course as { title?: string } | null)?.title })),
    };
  },

  // ── new-table bound (migration 20260615215535) ──────────────────────────
  // Dedicated backing tables; jsonb sub-item columns (lines/cues/hazards/steps)
  // are narrowed at runtime since they're Json in the generated types.
  async changeorder(db, orgId, id) {
    const { data: co } = await db
      .from("change_orders")
      .select("number, summary, total_delta_cents, currency, lines")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!co) return null;
    return {
      co: {
        number: co.number,
        summary: co.summary,
        total: money(co.total_delta_cents, co.currency),
        lines: Array.isArray(co.lines) ? co.lines : [],
      },
    };
  },

  async recap(db, orgId, id) {
    const { data: r } = await db
      .from("show_recaps")
      .select("event_name, headline, attendance, summary, event_date, site_name")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!r) return null;
    return {
      event: { name: r.event_name, date: date(r.event_date) },
      recap: { headline: r.headline, attendance: r.attendance != null ? String(r.attendance) : undefined, summary: r.summary },
      site: { name: r.site_name },
    };
  },

  async runofshow(db, orgId, id) {
    const { data: ros } = await db
      .from("run_of_shows")
      .select("name, cues")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!ros) return null;
    return { event: { name: ros.name }, ros: Array.isArray(ros.cues) ? ros.cues : [] };
  },

  async rams(db, orgId, id) {
    const { data: r } = await db
      .from("rams_assessments")
      .select("title, scope, rev, assessor, assessed_on, hazards, method")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!r) return null;
    return {
      rams: {
        title: r.title,
        scope: r.scope,
        rev: r.rev,
        assessor: r.assessor,
        date: date(r.assessed_on),
        method: r.method,
        ...Object.fromEntries((Array.isArray(r.hazards) ? r.hazards : []).map((h: unknown, i: number) => [String(i), h])),
      },
    };
  },

  async sop(db, orgId, id) {
    const { data: s } = await db
      .from("sops")
      .select("code, title, steps")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!s) return null;
    const steps = (Array.isArray(s.steps) ? s.steps : []) as { body?: string; title?: string }[];
    return {
      sop: {
        id: s.code,
        title: s.title,
        ...Object.fromEntries(steps.map((st, i) => [String(i), st?.body])),
      },
    };
  },

  async erp(db, orgId, id) {
    const { data: e } = await db
      .from("emergency_response_plans")
      .select("event_name, scope, rev, approver, approved_on, evac, ic_contact, hospital")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!e) return null;
    return {
      event: { name: e.event_name },
      erp: { scope: e.scope, rev: e.rev, approver: e.approver, date: date(e.approved_on), evac: e.evac, ic: e.ic_contact },
      site: { hospital: e.hospital },
    };
  },

  // ── kit v6.2 doc types ──────────────────────────────────────────────────
  async itinerary(db, orgId, id) {
    // Bound to a travel assignment (catalog_kind='travel') + its detail leg.
    const { data: a } = await db
      .from("assignments")
      .select("id, project_id, party_kind, party_user_id, party_crew_id, party_external_id")
      .eq("id", id)
      .eq("org_id", orgId)
      .eq("catalog_kind", "travel")
      .maybeSingle();
    if (!a) return null;
    const [{ data: det }, traveler, { data: project }] = await Promise.all([
      db
        .from("travel_assignment_details")
        .select("from_location, to_location, carrier, confirmation_code")
        .eq("assignment_id", id)
        .maybeSingle(),
      ticketHolderName(db, a),
      a.project_id ? db.from("projects").select("name").eq("id", a.project_id).maybeSingle() : noRow(),
    ]);
    const outbound = det
      ? [det.from_location, det.to_location].filter(Boolean).join(" → ") + (det.carrier ? ` · ${det.carrier}` : "")
      : undefined;
    return {
      traveler: { name: traveler },
      event: { name: project?.name },
      itinerary: { conf: det?.confirmation_code },
      leg: { outbound: outbound || undefined },
    };
  },

  async staffing(db, orgId, projectId) {
    // A staffing plan is a project's positions (its offer letters → crew).
    const { data: project } = await db
      .from("projects")
      .select("name, created_by")
      .eq("id", projectId)
      .eq("org_id", orgId)
      .maybeSingle();
    if (!project) return null;
    const [{ data: offers }, { data: coordinator }] = await Promise.all([
      db
        .from("offer_letters")
        .select("classification, letter_state, crew_member_id, created_at")
        .eq("org_id", orgId)
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
      project.created_by ? db.from("users").select("name").eq("id", project.created_by).maybeSingle() : noRow(),
    ]);
    const rows = offers ?? [];
    const crewIds = rows.map((o) => o.crew_member_id).filter(Boolean) as string[];
    const { data: crew } = crewIds.length
      ? await db.from("crew_members").select("id, name").in("id", crewIds)
      : { data: [] as { id: string; name: string }[] };
    const crewById = new Map((crew ?? []).map((c) => [c.id, c.name]));
    const filled = rows.filter((o) => o.letter_state === "accepted").length;
    return {
      project: { id: shortId(projectId) },
      event: { name: project.name },
      coordinator: coordinator?.name,
      staffing: {
        total: String(rows.length),
        filled: `${filled} / ${rows.length}`,
        summary: `${filled} filled`,
        ...Object.fromEntries(
          rows.map((o, i) => [
            String(i),
            { position: o.classification, assigned: crewById.get(o.crew_member_id ?? ""), state: o.letter_state },
          ]),
        ),
      },
    };
  },
};

async function ticketHolderName(
  db: DB,
  a: { party_kind: string | null; party_user_id: string | null; party_crew_id: string | null; party_external_id: string | null },
): Promise<string | undefined> {
  if (a.party_user_id) {
    const { data } = await db.from("users").select("name").eq("id", a.party_user_id).maybeSingle();
    return data?.name ?? undefined;
  }
  if (a.party_crew_id) {
    const { data } = await db.from("crew_members").select("name").eq("id", a.party_crew_id).maybeSingle();
    return data?.name ?? undefined;
  }
  if (a.party_external_id) {
    const { data } = await db.from("assignment_external_holders").select("holder_name").eq("id", a.party_external_id).maybeSingle();
    return data?.holder_name ?? undefined;
  }
  return undefined;
}

async function noRow(): Promise<{ data: null }> {
  return { data: null };
}
function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
async function clientForProject(db: DB, projectId: string | null): Promise<{ name: string } | null> {
  if (!projectId) return null;
  const { data: project } = await db.from("projects").select("client_id").eq("id", projectId).maybeSingle();
  if (!project?.client_id) return null;
  const { data: client } = await db.from("clients").select("name").eq("id", project.client_id).maybeSingle();
  return client ?? null;
}

/** Doc types that support internal record-binding (?recordId). */
export const RECORD_BOUND_DOC_TYPES = Object.keys(resolvers);

export function supportsRecordBinding(docType: string): boolean {
  return docType in resolvers;
}

/** Resolve a record to its document data object, or null if unbound/absent. */
export async function resolveDocData(docType: string, db: DB, orgId: string, recordId: string): Promise<DocData | null> {
  const fn = resolvers[docType];
  if (!fn) return null;
  return fn(db, orgId, recordId);
}

/**
 * Org/client brand for a document, mapped to the engine's OrgBrand/ClientBrand.
 * Org accent + logo come from the org branding JSON; client from the client row.
 */
export async function resolveDocBrand(
  db: DB,
  orgId: string,
  clientId?: string | null,
): Promise<{ org: OrgBrand; client?: ClientBrand }> {
  const [{ data: org }, { data: client }] = await Promise.all([
    db.from("orgs").select("name, name_override, logo_url, branding").eq("id", orgId).maybeSingle(),
    clientId ? db.from("clients").select("name, logo_url").eq("id", clientId).maybeSingle() : noRow(),
  ]);
  const branding = (org?.branding ?? {}) as { accent?: string; accentText?: string };
  return {
    org: {
      name: org?.name_override ?? org?.name ?? undefined,
      accent: branding.accent,
      accentText: branding.accentText,
      logo: org?.logo_url ?? undefined,
    },
    client: client ? { name: client.name ?? undefined, logo: client.logo_url ?? undefined } : undefined,
  };
}
