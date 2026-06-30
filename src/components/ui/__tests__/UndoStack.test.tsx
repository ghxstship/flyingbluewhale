import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useUndoStack } from "../UndoStack";

describe("useUndoStack", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useUndoStack());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.pending).toBeNull();
  });

  it("push → undo → redo runs the thunks and moves between branches", async () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const { result } = renderHook(() => useUndoStack());

    act(() => result.current.push({ label: "Renamed", undo, redo }));
    expect(result.current.canUndo).toBe(true);
    expect(result.current.pending?.label).toBe("Renamed");

    await act(async () => result.current.undo());
    expect(undo).toHaveBeenCalledTimes(1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    await act(async () => result.current.redo());
    expect(redo).toHaveBeenCalledTimes(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it("pushing a new action clears the redo branch", async () => {
    const { result } = renderHook(() => useUndoStack());
    act(() => result.current.push({ label: "A", undo: vi.fn(), redo: vi.fn() }));
    await act(async () => result.current.undo());
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.push({ label: "B", undo: vi.fn(), redo: vi.fn() }));
    expect(result.current.canRedo).toBe(false);
  });

  it("honors the history limit (drops the oldest)", () => {
    const { result } = renderHook(() => useUndoStack(2));
    act(() => {
      result.current.push({ label: "1", undo: vi.fn(), redo: vi.fn() });
      result.current.push({ label: "2", undo: vi.fn(), redo: vi.fn() });
      result.current.push({ label: "3", undo: vi.fn(), redo: vi.fn() });
    });
    expect(result.current.pending?.label).toBe("3");
  });

  it("clear empties both branches", async () => {
    const { result } = renderHook(() => useUndoStack());
    act(() => result.current.push({ label: "A", undo: vi.fn(), redo: vi.fn() }));
    act(() => result.current.clear());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
});
