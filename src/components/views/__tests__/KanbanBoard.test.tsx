import { describe, it, expect } from "vitest";
import { groupByLane } from "../groupByLane";

describe("groupByLane", () => {
  it("groups rows by laneOf result", () => {
    const rows = [
      { id: "1", state: "open" },
      { id: "2", state: "open" },
      { id: "3", state: "done" },
    ];
    const grouped = groupByLane(rows, (r) => r.state);
    expect(grouped.open).toHaveLength(2);
    expect(grouped.done).toHaveLength(1);
    expect(grouped.open?.map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("drops rows where laneOf returns null", () => {
    const rows: Array<{ id: string; state: string | null }> = [{ id: "1", state: null }];
    const grouped = groupByLane(rows, (r) => r.state);
    expect(grouped).toEqual({});
  });

  it("drops rows where laneOf returns undefined", () => {
    const rows: Array<{ id: string }> = [{ id: "1" }];
    const grouped = groupByLane(rows, () => undefined);
    expect(grouped).toEqual({});
  });

  it("preserves input order within each lane", () => {
    const rows = [
      { id: "a", state: "x" },
      { id: "b", state: "y" },
      { id: "c", state: "x" },
      { id: "d", state: "y" },
    ];
    const grouped = groupByLane(rows, (r) => r.state);
    expect(grouped.x?.map((r) => r.id)).toEqual(["a", "c"]);
    expect(grouped.y?.map((r) => r.id)).toEqual(["b", "d"]);
  });

  it("creates an empty record when rows is empty", () => {
    const grouped = groupByLane<{ id: string; state: string }>([], (r) => r.state);
    expect(grouped).toEqual({});
  });

  it("supports a wide variety of lane ids (status enums)", () => {
    type Task = { id: string; status: "todo" | "in_progress" | "blocked" | "review" | "done" };
    const rows: Task[] = [
      { id: "1", status: "todo" },
      { id: "2", status: "in_progress" },
      { id: "3", status: "blocked" },
      { id: "4", status: "review" },
      { id: "5", status: "done" },
      { id: "6", status: "in_progress" },
    ];
    const grouped = groupByLane(rows, (r) => r.status);
    expect(Object.keys(grouped).sort()).toEqual(["blocked", "done", "in_progress", "review", "todo"]);
    expect(grouped.in_progress).toHaveLength(2);
  });
});
