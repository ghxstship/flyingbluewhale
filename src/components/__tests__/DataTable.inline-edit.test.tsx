import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Same mock surface as DataView.smoke — DataTableInteractive reaches for Next
// navigation, user-preferences, sonner, and react-virtual at module load.
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

import { fireEvent, render, screen, within } from "@testing-library/react";
import { DataTableInteractive } from "../DataTableInteractive";

const baseProps = {
  // pageSize bypasses the virtualizer so rows render in jsdom.
  pageSize: 10,
  columns: [{ key: "name", header: "Name", editable: true }],
  rows: [{ id: "1", cells: ["Alice"], values: ["Alice"] }],
};

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("DataTable inline editing (v7.7)", () => {
  it("double-click → type → Enter commits via onCellEdit and shows the new value", () => {
    const onCellEdit = vi.fn();
    render(<DataTableInteractive {...baseProps} onCellEdit={onCellEdit} />);

    const cell = screen.getByRole("button", { name: "Alice" });
    fireEvent.doubleClick(cell);
    const input = screen.getByLabelText("Edit cell") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Bob" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCellEdit).toHaveBeenCalledWith("1", "name", "Bob");
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("Escape cancels without calling onCellEdit", () => {
    const onCellEdit = vi.fn();
    render(<DataTableInteractive {...baseProps} onCellEdit={onCellEdit} />);

    fireEvent.doubleClick(screen.getByRole("button", { name: "Alice" }));
    const input = screen.getByLabelText("Edit cell") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Bob" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onCellEdit).not.toHaveBeenCalled();
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("Undo reverts the edit (and re-persists the old value)", () => {
    const onCellEdit = vi.fn();
    render(<DataTableInteractive {...baseProps} onCellEdit={onCellEdit} />);

    fireEvent.doubleClick(screen.getByRole("button", { name: "Alice" }));
    const input = screen.getByLabelText("Edit cell") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Bob" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Bob")).toBeTruthy();

    // UndoBar surfaces once an edit exists.
    const undoBar = screen.getByRole("status");
    fireEvent.click(within(undoBar).getByRole("button", { name: "Undo" }));

    expect(onCellEdit).toHaveBeenLastCalledWith("1", "name", "Alice");
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("is inert without onCellEdit — no editor, plain cell", () => {
    render(<DataTableInteractive {...baseProps} />);
    expect(screen.queryByRole("button", { name: "Alice" })).toBeNull();
    expect(screen.getByText("Alice")).toBeTruthy();
  });
});
