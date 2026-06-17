/**
 * Offer-letter binding bridge guard — a resolved `offer_letters` record must
 * map cleanly onto the kit `offerletter` template's merge-field data-paths, and
 * every path the bridge produces must be one the enriched template reads (no
 * orphan bindings, no missing coverage). This is the guard that keeps the kit
 * doc from silently falling back to sample copy on a real letter.
 */
import { describe, it, expect } from "vitest";
import { offerLetterData, type OfferBindingInput } from "./offer-binding";
import { getDocTemplate } from "./registry";
import { paths, getPath } from "./contract";

const LETTER: OfferBindingInput = {
  id: "abcd1234efgh5678",
  recipient_name: "Dana Lin",
  project_name: "Miami Music Week",
  role_title: "Lighting Designer",
  role_department: "Lighting",
  classification: "1099",
  employer: "ghxstship",
  reports_to_name: "M. Soto",
  reports_to_role: "Production Manager",
  venue_name: "Bayfront Park",
  venue_city: "Miami",
  venue_region: "FL",
  travel_in_date: "2026-08-02",
  onsite_start_date: "2026-08-04",
  onsite_end_date: "2026-08-09",
  travel_out_date: "2026-08-10",
  effective_onsite_start: null, // falls back to onsite_start_date
  effective_onsite_end: null,
  engagement_days: 6,
  compensation_basis: "per_day",
  effective_compensation_cents: 390000,
  rate_name: "Crew Day Rate",
  rate_unit_price_cents: 65000,
  effective_per_diem_cents: 7500,
  effective_payment_schedule: "Net 30 on accepted deliverables",
  effective_inclusions: ["Crew meals on call days"],
  effective_travel_provided: true, // → second inclusion line
  effective_lodging_provided: false,
  effective_meals_provided: false,
  signing_authority_name: "Julian Clarkson",
  signing_authority_title: "Producer & Operations Director",
};

describe("offer-letter binding bridge", () => {
  const data = offerLetterData(LETTER);

  it("maps the resolved record into the template's merge-field namespaces", () => {
    expect(getPath(data, "offer.id")).toBe("OL-ABCD1234");
    expect(getPath(data, "candidate.name")).toBe("Dana Lin");
    expect(getPath(data, "offer.role")).toBe("Lighting Designer");
    expect(getPath(data, "offer.department")).toBe("Lighting");
    expect(getPath(data, "offer.classification")).toBe("1099 Independent Contractor");
    expect(getPath(data, "offer.employer")).toContain("GHXSTSHIP");
    expect(getPath(data, "offer.project")).toBe("Miami Music Week");
    expect(getPath(data, "offer.reportsTo")).toBe("M. Soto · Production Manager");
    expect(getPath(data, "offer.workLocation")).toBe("Bayfront Park · Miami · FL");
    expect(getPath(data, "offer.days")).toBe("6");
    expect(getPath(data, "dates.travelIn")).toBe("August 2, 2026");
    expect(getPath(data, "dates.onsiteStart")).toBe("August 4, 2026");
    expect(getPath(data, "dates.onsiteEnd")).toBe("August 9, 2026");
    expect(getPath(data, "dates.travelOut")).toBe("August 10, 2026");
    expect(getPath(data, "comp.basis")).toBe("Per Day");
    expect(getPath(data, "comp.amount")).toContain("$650");
    expect(getPath(data, "comp.reimbursement")).toContain("$75");
    expect(getPath(data, "comp.paymentSchedule")).toBe("Net 30 on accepted deliverables");
    // explicit inclusions then the provided-flag lines
    expect(getPath(data, "inclusions.0")).toBe("Crew meals on call days");
    expect(getPath(data, "inclusions.1")).toBe("Travel provided / arranged");
    expect(getPath(data, "signer.name")).toBe("Julian Clarkson");
    expect(getPath(data, "signer.title")).toBe("Producer & Operations Director");
  });

  it("emits no path the enriched template does not read (no orphan bindings)", () => {
    const templatePaths = new Set(paths(getDocTemplate("offerletter")!));
    const flat: string[] = [];
    const walk = (obj: unknown, prefix: string) => {
      if (obj == null || typeof obj !== "object") {
        flat.push(prefix);
        return;
      }
      for (const [k, v] of Object.entries(obj)) walk(v, prefix ? `${prefix}.${k}` : k);
    };
    walk(data, "");
    const orphans = flat.filter((p) => !templatePaths.has(p));
    expect(orphans, `orphan paths: ${orphans.join(", ")}`).toEqual([]);
  });

  it("omits namespaces the record doesn't carry (honest fallback)", () => {
    const sparse = offerLetterData({
      id: "00000000ffff1111",
      recipient_name: null,
      project_name: null,
      role_title: null,
      role_department: null,
      classification: null,
      employer: null,
      reports_to_name: null,
      reports_to_role: null,
      venue_name: null,
      venue_city: null,
      venue_region: null,
      travel_in_date: null,
      onsite_start_date: null,
      onsite_end_date: null,
      travel_out_date: null,
      effective_onsite_start: null,
      effective_onsite_end: null,
      engagement_days: 0,
      compensation_basis: null,
      effective_compensation_cents: 0,
      rate_name: null,
      rate_unit_price_cents: null,
      effective_per_diem_cents: 0,
      effective_payment_schedule: null,
      effective_inclusions: [],
      effective_travel_provided: false,
      effective_lodging_provided: false,
      effective_meals_provided: false,
      signing_authority_name: null,
      signing_authority_title: null,
    });
    // Only the always-present identity ref survives; every optional namespace
    // is omitted so the engine falls back to the template sample.
    expect(getPath(sparse, "offer.id")).toBe("OL-00000000");
    expect(sparse.candidate).toBeUndefined();
    expect(sparse.dates).toBeUndefined();
    expect(sparse.comp).toBeUndefined();
    expect(sparse.inclusions).toBeUndefined();
    expect(sparse.signer).toBeUndefined();
    expect(getPath(sparse, "offer.role")).toBeUndefined();
  });
});
