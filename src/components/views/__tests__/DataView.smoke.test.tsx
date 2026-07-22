import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// DataView's table path renders DataTableInteractive, which reaches for Next
// navigation, user-preferences, sonner, and react-virtual at module load.
// Mirror the DataTable.totals mock surface so the table view mounts.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/studio/test",
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: React.PropsWithChildren<{ href: string }>) =>
    React.createElement("a", { href, ...rest }, children),
}));
vi.mock("@/lib/hooks/useUserPreferences", () => ({
  useUserPreferences: () => ({ prefs: {}, setPrefs: vi.fn().mockResolvedValue(undefined), loading: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: () => ({ getVirtualItems: () => [], getTotalSize: () => 0 }),
}));

import { render, screen } from "@testing-library/react";
import { DataView } from "../DataView";

type Row = { id: string; name: string; state: string };
const rows: Row[] = [
  { id: "1", name: "Alpha", state: "open" },
  { id: "2", name: "Beta", state: "done" },
];
const columns = [{ key: "name", header: "Name" }];
const toRow = (r: Row) => ({ id: r.id, cells: [r.name], values: [r.name] });

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("DataView — canonical collection wrapper", () => {
  it("mounts the table path (pageSize bypasses virtualization)", () => {
    expect(() =>
      render(<DataView tableId="t" rows={rows} columns={columns} toRow={toRow} pageSize={50} />),
    ).not.toThrow();
    expect(screen.getByText("Alpha")).toBeTruthy();
  });

  it("renders the view toggle only when >1 view is allowed", () => {
    const { container } = render(
      <DataView
        tableId="t2"
        rows={rows}
        columns={columns}
        toRow={toRow}
        pageSize={50}
        gallery={{ toItem: (r) => ({ id: r.id, title: r.name }) }}
      />,
    );
    // table + gallery → switcher present.
    expect(container.textContent).toContain("Alpha");
  });

  it("accepts a board adapter + peek drawer without throwing", () => {
    expect(() =>
      render(
        <DataView
          tableId="t3"
          rows={rows}
          columns={columns}
          toRow={toRow}
          pageSize={50}
          board={{
            lanes: [
              { id: "open", title: "Open" },
              { id: "done", title: "Done" },
            ],
            laneOf: (r) => r.state,
            renderCard: (r) => <span>{r.name}</span>,
            onMove: vi.fn(),
          }}
          peek={{ title: (r) => r.name, render: (r) => <div>peek {r.name}</div> }}
        />,
      ),
    ).not.toThrow();
  });

  // ── B0 · DataTable-parity hardening (Option B, 2026-07-22) ───────────────

  it("rich (DataTable-shaped) columns render without toRow, with the DATA mono face", () => {
    const { container } = render(
      <DataView<Row>
        tableId="t4"
        rows={rows}
        columns={[
          { key: "name", header: "Name", render: (r) => <span>{r.name}</span> },
          { key: "state", header: "State", mono: true, render: (r) => r.state, accessor: (r) => r.state },
          { key: "count", header: "Count", numeric: true, render: () => "1", accessor: () => 1 },
        ]}
        rowHref={(r) => `/studio/test/${r.id}`}
        pageSize={50}
      />,
    );
    expect(screen.getByText("Alpha")).toBeTruthy();
    // W2 root-cause built right: mono CELLS ride --p-mono-data, never the
    // Tailwind font-mono shortcut (Space Mono).
    const monoCell = Array.from(container.querySelectorAll("td")).find((td) => td.textContent === "open");
    expect(monoCell?.className).toContain("--p-mono-data");
    expect(monoCell?.className).not.toMatch(/\bfont-mono\b/);
    // numeric columns ride the .ps-table `num` kit variant.
    expect(container.querySelector("td.num, th.num")).toBeTruthy();
  });

  it("rich mode + empty rows renders the structure-preserving empty state", () => {
    const { container } = render(
      <DataView<Row>
        tableId="t5"
        rows={[]}
        columns={[{ key: "name", header: "Name", render: (r) => r.name }]}
        emptyLabel="No Test Rows Yet"
        emptyDescription="Add one to get going."
        pageSize={50}
      />,
    );
    // Headers stay visible (ghost table) + the message renders.
    expect(container.querySelector("table.ps-table")).toBeTruthy();
    expect(screen.getAllByText("No Test Rows Yet").length).toBeGreaterThan(0);
  });

  it("loading renders the table skeleton", () => {
    const { container } = render(
      <DataView<Row>
        tableId="t6"
        rows={rows}
        columns={[{ key: "name", header: "Name", render: (r) => r.name }]}
        loading
        pageSize={50}
      />,
    );
    expect(container.querySelector("[aria-busy='true']")).toBeTruthy();
    expect(container.querySelector(".ps-skel")).toBeTruthy();
  });

  it("accepts serialized (by-row) board/gallery/peek adapters — the DataViewServer contract", () => {
    expect(() =>
      render(
        <DataView<Row>
          tableId="t7"
          rows={rows}
          columns={[{ key: "name", header: "Name", render: (r) => r.name }]}
          pageSize={50}
          board={{
            lanes: [
              { id: "open", title: "Open" },
              { id: "done", title: "Done" },
            ],
            laneIdByRow: { "1": "open", "2": "done" },
            cardByRow: { "1": <span>Alpha card</span>, "2": <span>Beta card</span> },
            onMove: vi.fn(),
          }}
          gallery={{ cardByRow: { "1": <span>Alpha tile</span>, "2": <span>Beta tile</span> }, columns: 3 }}
          peek={{ byRow: { "1": { body: <div>peek Alpha</div>, href: "/studio/test/1" }, "2": { body: <div>peek Beta</div> } } }}
        />,
      ),
    ).not.toThrow();
  });
});
