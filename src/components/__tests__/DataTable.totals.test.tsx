import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js navigation hooks before importing the component (the
// component reaches for them at module load via `useUrlState`). The mocks
// stay inert — useUrlState falls back to its initial-value when these
// don't propagate state.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/test",
}));

// next/link in jsdom — render as a plain anchor.
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: React.PropsWithChildren<{ href: string }>) =>
    React.createElement("a", { href, ...rest }, children),
}));

// `useUserPreferences` reaches a /api/v1/me/preferences fetch — short-circuit
// it in tests so the table renders synchronously without a real backend.
vi.mock("@/lib/hooks/useUserPreferences", () => ({
  useUserPreferences: () => ({ prefs: {}, setPrefs: vi.fn().mockResolvedValue(undefined), loading: false }),
}));

// `sonner` toast — silence in tests.
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// `@tanstack/react-virtual` — return a stub virtualizer so the table falls
// back to rendering nothing for the virtual list path. Tests below all use
// `pageSize` so virtualization is bypassed anyway.
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: () => ({ getVirtualItems: () => [], getTotalSize: () => 0 }),
}));

import { render, screen } from "@testing-library/react";
import {
  DataTableInteractive,
  computeTotals,
  type InteractiveColumn,
  type InteractiveRow,
} from "../DataTableInteractive";

beforeEach(() => {
  // Reset any DOM left over between tests.
  document.body.innerHTML = "";
});

describe("computeTotals", () => {
  const cols: InteractiveColumn[] = [
    { key: "name", header: "Name" },
    { key: "amount", header: "Amount", total: "sum" },
    { key: "score", header: "Score", total: "avg" },
    { key: "count", header: "Count", total: "count" },
  ];
  const idx = new Map<string, number>(cols.map((c, i) => [c.key, i]));
  const rows: InteractiveRow[] = [
    { id: "1", cells: [], values: ["A", 100, 80, "x"] },
    { id: "2", cells: [], values: ["B", 200, null, "y"] },
    { id: "3", cells: [], values: ["C", 300, 90, null] },
  ];

  it("sums numeric columns ignoring nulls", () => {
    const totals = computeTotals(cols, rows, idx);
    expect(totals.amount?.raw).toBe(600);
    expect(totals.amount?.value).toBe("600");
  });

  it("avg ignores null values (mean of non-null only)", () => {
    const totals = computeTotals(cols, rows, idx);
    // (80 + 90) / 2 = 85
    expect(totals.score?.raw).toBe(85);
    expect(totals.score?.value).toBe("85");
  });

  it("count includes only non-null values", () => {
    const totals = computeTotals(cols, rows, idx);
    expect(totals.count?.raw).toBe(2);
    expect(totals.count?.value).toBe("2");
  });

  it("emits em-dash when no eligible numeric values", () => {
    const emptyRows: InteractiveRow[] = [{ id: "1", cells: [], values: ["A", null, null, null] }];
    const totals = computeTotals(cols, emptyRows, idx);
    expect(totals.amount?.value).toBe("—");
    expect(totals.amount?.raw).toBe(null);
  });

  it("respects totalFormat when provided", () => {
    const formattedCols: InteractiveColumn[] = [
      { key: "amount", header: "Amount", total: "sum", totalFormat: (n) => `$${n.toFixed(2)}` },
    ];
    const fIdx = new Map<string, number>([["amount", 0]]);
    const fRows: InteractiveRow[] = [
      { id: "1", cells: [], values: [12.5] },
      { id: "2", cells: [], values: [37.25] },
    ];
    const totals = computeTotals(formattedCols, fRows, fIdx);
    expect(totals.amount?.value).toBe("$49.75");
    expect(totals.amount?.raw).toBeCloseTo(49.75);
  });

  it("min/max iterate the numeric set", () => {
    const mmCols: InteractiveColumn[] = [
      { key: "v", header: "v", total: "min" },
      { key: "v2", header: "v2", total: "max" },
    ];
    const mmIdx = new Map<string, number>([
      ["v", 0],
      ["v2", 1],
    ]);
    const mmRows: InteractiveRow[] = [
      { id: "1", cells: [], values: [3, 3] },
      { id: "2", cells: [], values: [-1, -1] },
      { id: "3", cells: [], values: [5, 5] },
    ];
    const totals = computeTotals(mmCols, mmRows, mmIdx);
    expect(totals.v?.raw).toBe(-1);
    expect(totals.v2?.raw).toBe(5);
  });
});

describe("DataTableInteractive — totals footer", () => {
  it("renders a tfoot with the column sum when total is set", () => {
    const cols: InteractiveColumn[] = [
      { key: "name", header: "Name" },
      { key: "amount", header: "Amount", total: "sum" },
    ];
    const rows: InteractiveRow[] = [
      { id: "1", cells: ["A", "10"], values: ["A", 10] },
      { id: "2", cells: ["B", "20"], values: ["B", 20] },
      { id: "3", cells: ["C", "30"], values: ["C", 30] },
    ];
    const { container } = render(<DataTableInteractive rows={rows} columns={cols} pageSize={10} searchable={false} />);
    const tfoot = container.querySelector("tfoot");
    expect(tfoot).toBeTruthy();
    // Sum cell content
    expect(tfoot?.textContent).toContain("60");
  });

  it("does not render tfoot when no column has total set", () => {
    const cols: InteractiveColumn[] = [
      { key: "name", header: "Name" },
      { key: "amount", header: "Amount" },
    ];
    const rows: InteractiveRow[] = [{ id: "1", cells: ["A", "10"], values: ["A", 10] }];
    const { container } = render(<DataTableInteractive rows={rows} columns={cols} pageSize={10} searchable={false} />);
    expect(container.querySelector("tfoot")).toBeNull();
  });
});

describe("DataTableInteractive — spotlight (row className)", () => {
  it("applies row className from InteractiveRow", () => {
    const cols: InteractiveColumn[] = [{ key: "name", header: "Name" }];
    const rows: InteractiveRow[] = [
      { id: "1", cells: ["overdue"], values: ["overdue"], className: "data-spotlight-error" },
      { id: "2", cells: ["fine"], values: ["fine"] },
    ];
    render(<DataTableInteractive rows={rows} columns={cols} pageSize={10} searchable={false} />);
    const overdueCell = screen.getByText("overdue");
    const overdueRow = overdueCell.closest("tr");
    expect(overdueRow?.className).toContain("data-spotlight-error");

    const fineCell = screen.getByText("fine");
    const fineRow = fineCell.closest("tr");
    expect(fineRow?.className).not.toContain("data-spotlight-error");
  });

  it("applies per-cell className overrides for cell-scope spotlight", () => {
    const cols: InteractiveColumn[] = [
      { key: "name", header: "Name" },
      { key: "status", header: "Status" },
    ];
    const rows: InteractiveRow[] = [
      {
        id: "1",
        cells: ["A", "blocked"],
        values: ["A", "blocked"],
        cellClassNames: { status: "data-spotlight-warn" },
      },
    ];
    const { container } = render(<DataTableInteractive rows={rows} columns={cols} pageSize={10} searchable={false} />);
    // Find the second td (status column) of the data row.
    const tds = container.querySelectorAll("tbody td");
    expect(tds.length).toBeGreaterThanOrEqual(2);
    const statusCell = tds[1];
    expect(statusCell?.className).toContain("data-spotlight-warn");
  });
});
