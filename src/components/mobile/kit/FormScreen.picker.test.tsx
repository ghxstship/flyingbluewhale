import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormScreen } from "./FormScreen";
import type { FormDef } from "./forms";

/**
 * Kit 32 Drawer System (v2.8) — the cost-code picker rule:
 * a `select` field with ≤8 options keeps the native <select>; past 8 it
 * renders as a searchable single-pick ACTION drawer (SheetHead + search +
 * checkmark rows). The picked value must flow through the same form-values
 * contract as the native control.
 */

const MANY = [
  "0000 · Executive",
  "1000 · Creative",
  "2000 · Production",
  "3000 · Staffing",
  "4000 · Hospitality",
  "5000 · Logistics",
  "6000 · Site Ops",
  "7000 · Marketing",
  "8000 · Finance",
  "9000 · Technology",
];

const def: FormDef = {
  title: "Picker Fixture",
  icon: "Receipt",
  submit: "Submit",
  fields: [
    { id: "few", label: "Few Options", type: "select", options: ["A", "B", "C"] },
    { id: "code", label: "Cost Code", type: "select", options: MANY },
  ],
};

describe("FormScreen select → picker drawer threshold (kit 32 v2.8)", () => {
  it("keeps the native select at ≤8 options", () => {
    render(<FormScreen def={def} onClose={vi.fn()} onSubmit={vi.fn()} />);
    // The 3-option field is a real <select>…
    expect(screen.getByRole("combobox")).toBeTruthy();
    // …and there is exactly one (the 10-option field did NOT render one).
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
  });

  it("renders >8 options as a searchable action drawer and commits the pick", () => {
    const onSubmit = vi.fn();
    render(<FormScreen def={def} onClose={vi.fn()} onSubmit={onSubmit} />);

    // Trigger carries dialog semantics; its accessible name is the field
    // label (the wrapper <label htmlFor> now genuinely associates), while the
    // empty-state placeholder stays the visible text.
    const trigger = screen.getByRole("button", { name: "Cost Code" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.textContent).toContain("Choose…");

    // Open the drawer: SheetHead title + option count + search box.
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Cost Code" });
    expect(dialog.textContent).toContain("10 Options");
    expect(screen.getByText("0000 · Executive")).toBeTruthy();

    // Search narrows the list.
    fireEvent.change(screen.getByLabelText("Search Cost Code"), { target: { value: "tech" } });
    expect(screen.queryByText("0000 · Executive")).toBeNull();
    expect(screen.getByText("9000 · Technology")).toBeTruthy();

    // Picking closes the drawer and lands the value on the trigger…
    fireEvent.click(screen.getByText("9000 · Technology"));
    expect(screen.queryByRole("dialog", { name: "Cost Code" })).toBeNull();
    expect(screen.getByRole("button", { name: "Cost Code" }).textContent).toContain("9000 · Technology");

    // …and the submitted values carry it exactly like a native select would.
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledWith(def, expect.objectContaining({ code: "9000 · Technology" }));
  });
});
