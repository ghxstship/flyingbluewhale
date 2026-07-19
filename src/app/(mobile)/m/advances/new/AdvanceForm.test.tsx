import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdvanceForm, type CatalogPick } from "./AdvanceForm";

/**
 * Guards the COMPVSS advance intake's core promise: the Item field is a
 * catalog lookup FILTERED BY the selected Category (real catalog kinds), not
 * a free-text field — with an explicit "special order" escape hatch for an
 * item that isn't in the catalog.
 */

const requestAdvanceMock = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: true }));
vi.mock("../actions", () => ({ requestAdvance: requestAdvanceMock }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/i18n/LocaleProvider", () => ({
  // Resolve every key to its inline fallback so labels read as authored.
  useT: () => (_k: string, _v: unknown, fb?: string) => fb ?? _k,
}));

const CATALOG: CatalogPick[] = [
  { id: "cred-1", kind: "credential", code: "CRD-001", name: "All-Access" },
  { id: "cred-2", kind: "credential", code: "CRD-002", name: "Backstage" },
  { id: "rad-1", kind: "radio", code: "RAD-001", name: "Motorola R7" },
  { id: "rad-2", kind: "radio", code: "RAD-002", name: "Motorola R2" },
];

/** The submitted FormData from the most recent requestAdvance call. */
function lastPayload(): FormData {
  const call = requestAdvanceMock.mock.calls.at(-1);
  return call![1] as FormData;
}

/** Fill the always-required window + purpose so the CTA arms. */
function fillCommon(container: HTMLElement) {
  const dates = container.querySelectorAll<HTMLInputElement>('input[type="date"]');
  fireEvent.change(dates[0]!, { target: { value: "2030-01-01" } });
  fireEvent.change(dates[1]!, { target: { value: "2030-01-05" } });
  // Textareas: [0]=Special Requests, [1]=Operational Purpose, [2]=Notes.
  const areas = container.querySelectorAll<HTMLTextAreaElement>("textarea");
  fireEvent.change(areas[1]!, { target: { value: "Ops coverage" } });
}

describe("AdvanceForm — category-filtered catalog lookup", () => {
  beforeEach(() => requestAdvanceMock.mockClear());

  it("offers only the catalog kinds that have active SKUs as categories", () => {
    const { container } = render(<AdvanceForm catalog={CATALOG} />);
    const category = container.querySelectorAll("select")[0]!;
    const opts = [...category.querySelectorAll("option")].map((o) => o.textContent);
    expect(opts).toContain("Credentials");
    expect(opts).toContain("Radios");
    // Kinds with no SKUs in the catalog are not offered.
    expect(opts).not.toContain("Tickets");
    expect(opts).not.toContain("Lodging");
  });

  it("filters the Item lookup to the selected category", () => {
    const { container } = render(<AdvanceForm catalog={CATALOG} />);
    const category = container.querySelectorAll("select")[0]!;

    fireEvent.change(category, { target: { value: "Radios" } });
    let item = container.querySelectorAll("select")[1]!;
    let itemOpts = [...item.querySelectorAll("option")].map((o) => o.textContent);
    expect(itemOpts).toEqual(expect.arrayContaining(["Motorola R2 · RAD-002", "Motorola R7 · RAD-001"]));
    expect(itemOpts.some((o) => o?.includes("All-Access"))).toBe(false);

    // Switching category re-filters the item options.
    fireEvent.change(category, { target: { value: "Credentials" } });
    item = container.querySelectorAll("select")[1]!;
    itemOpts = [...item.querySelectorAll("option")].map((o) => o.textContent);
    expect(itemOpts).toEqual(expect.arrayContaining(["All-Access · CRD-001", "Backstage · CRD-002"]));
    expect(itemOpts.some((o) => o?.includes("Motorola"))).toBe(false);
  });

  it("binds the picked SKU by id on submit (no free-text item)", async () => {
    const { container, getByRole } = render(<AdvanceForm catalog={CATALOG} />);
    const category = container.querySelectorAll("select")[0]!;
    fireEvent.change(category, { target: { value: "Radios" } });
    const item = container.querySelectorAll("select")[1]!;
    fireEvent.change(item, { target: { value: "Motorola R7 · RAD-001" } });
    fillCommon(container);

    fireEvent.click(getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(requestAdvanceMock).toHaveBeenCalled());
    const fd = lastPayload();
    expect(fd.get("kind")).toBe("radio");
    expect(fd.get("catalogItemId")).toBe("rad-1");
    expect(fd.get("type")).toBe("Motorola R7"); // title = the SKU name
    expect(fd.get("special_order")).toBeNull();
  });

  it("special order swaps the lookup for a custom-item field and flags the request", async () => {
    const { container, getByRole } = render(<AdvanceForm catalog={CATALOG} />);
    const category = container.querySelectorAll("select")[0]!;
    fireEvent.change(category, { target: { value: "Radios" } });

    // Two selects (category + item) before the toggle.
    expect(container.querySelectorAll("select")).toHaveLength(2);

    fireEvent.click(getByRole("switch", { name: /special order/i }));

    // Item select is gone; a Custom Item text input took its place.
    expect(container.querySelectorAll("select")).toHaveLength(1);
    const custom = container.querySelector<HTMLInputElement>('input[type="text"]')!;
    fireEvent.change(custom, { target: { value: "Bespoke IEM pack" } });
    fillCommon(container);

    fireEvent.click(getByRole("button", { name: "Submit Request" }));

    await waitFor(() => expect(requestAdvanceMock).toHaveBeenCalled());
    const fd = lastPayload();
    expect(fd.get("kind")).toBe("radio");
    expect(fd.get("special_order")).toBe("1");
    expect(fd.get("type")).toBe("Bespoke IEM pack");
    expect(fd.get("catalogItemId")).toBeNull();
  });

  it("preselects category + item when the catalog CTA binds a SKU", () => {
    const { container } = render(
      <AdvanceForm catalog={CATALOG} catalogItemId="rad-2" fromCatalog catalogItemName="Motorola R2" />,
    );
    const category = container.querySelectorAll("select")[0]! as HTMLSelectElement;
    expect(category.value).toBe("Radios");
    const item = container.querySelectorAll("select")[1]! as HTMLSelectElement;
    expect(item.value).toBe("Motorola R2 · RAD-002");
  });
});
