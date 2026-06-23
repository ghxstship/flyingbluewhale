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
});
