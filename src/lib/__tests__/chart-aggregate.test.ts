import { describe, it, expect } from "vitest";
import { aggregateByGroup, pivotForChart } from "../views/chart-aggregate";
import type { ChartViewConfig } from "../views/chart-config";

describe("aggregateByGroup", () => {
  it("sums values by group", () => {
    const rows = [
      { region: "NA", sales: 10 },
      { region: "NA", sales: 20 },
      { region: "EU", sales: 5 },
    ];
    expect(
      aggregateByGroup(rows, {
        groupBy: "region",
        series: [{ field: "sales", agg: "sum" }],
      }),
    ).toEqual([
      { region: "NA", sales: 30 },
      { region: "EU", sales: 5 },
    ]);
  });

  it("avg ignores nulls in the denominator", () => {
    const rows = [
      { region: "NA", price: 10 },
      { region: "NA", price: null },
      { region: "NA", price: 30 },
    ];
    expect(
      aggregateByGroup(rows, {
        groupBy: "region",
        series: [{ field: "price", agg: "avg" }],
      }),
    ).toEqual([{ region: "NA", price: 20 }]);
  });

  it("count_distinct excludes nulls", () => {
    const rows = [
      { team: "A", member: "alice" },
      { team: "A", member: "bob" },
      { team: "A", member: "alice" },
      { team: "A", member: null },
      { team: "A", member: undefined },
    ];
    expect(
      aggregateByGroup(rows, {
        groupBy: "team",
        series: [{ field: "member", agg: "count_distinct" }],
      }),
    ).toEqual([{ team: "A", member: 2 }]);
  });

  it("count includes nulls (total row count)", () => {
    const rows = [
      { team: "A", member: "alice" },
      { team: "A", member: null },
      { team: "A", member: "bob" },
    ];
    expect(
      aggregateByGroup(rows, {
        groupBy: "team",
        series: [{ field: "member", agg: "count" }],
      }),
    ).toEqual([{ team: "A", member: 3 }]);
  });

  it("min/max work on negatives", () => {
    const rows = [
      { region: "NA", delta: -5 },
      { region: "NA", delta: -20 },
      { region: "NA", delta: -1 },
    ];
    const min = aggregateByGroup(rows, {
      groupBy: "region",
      series: [{ field: "delta", agg: "min" }],
    });
    const max = aggregateByGroup(rows, {
      groupBy: "region",
      series: [{ field: "delta", agg: "max" }],
    });
    expect(min).toEqual([{ region: "NA", delta: -20 }]);
    expect(max).toEqual([{ region: "NA", delta: -1 }]);
  });

  it("aggregates multiple series in one pass", () => {
    const rows = [
      { region: "NA", revenue: 100, expenses: 40 },
      { region: "NA", revenue: 200, expenses: 60 },
      { region: "EU", revenue: 50, expenses: 30 },
    ];
    expect(
      aggregateByGroup(rows, {
        groupBy: "region",
        series: [
          { field: "revenue", agg: "sum" },
          { field: "expenses", agg: "avg" },
        ],
      }),
    ).toEqual([
      { region: "NA", revenue: 300, expenses: 50 },
      { region: "EU", revenue: 50, expenses: 30 },
    ]);
  });

  it("pass-through (no groupBy) returns shallow copies", () => {
    const rows = [{ x: 1, y: 2 }];
    const out = aggregateByGroup(rows, {
      series: [{ field: "y", agg: "sum" }],
    });
    expect(out).toEqual(rows);
    expect(out[0]).not.toBe(rows[0]);
  });

  it("coerces numeric strings", () => {
    const rows = [
      { region: "NA", sales: "10" },
      { region: "NA", sales: "20" },
    ];
    expect(
      aggregateByGroup(rows, {
        groupBy: "region",
        series: [{ field: "sales", agg: "sum" }],
      }),
    ).toEqual([{ region: "NA", sales: 30 }]);
  });
});

describe("pivotForChart sort+topN", () => {
  const baseConfig = (overrides: Partial<ChartViewConfig> = {}): ChartViewConfig => ({
    type: "bar",
    x: { field: "name" },
    series: [{ field: "value", agg: "sum" }],
    ...overrides,
  });

  it("respects topN with value-desc sort", () => {
    const rows = [
      { name: "small", value: 5 },
      { name: "huge", value: 100 },
      { name: "medium", value: 50 },
      { name: "tiny", value: 1 },
    ];
    const out = pivotForChart(rows, baseConfig({ sortX: "value-desc", topN: 2 }));
    expect(out).toEqual([
      { name: "huge", value: 100 },
      { name: "medium", value: 50 },
    ]);
  });

  it("sorts asc by x field", () => {
    const rows = [
      { name: "c", value: 3 },
      { name: "a", value: 1 },
      { name: "b", value: 2 },
    ];
    const out = pivotForChart(rows, baseConfig({ sortX: "asc" }));
    expect(out.map((r) => r.name)).toEqual(["a", "b", "c"]);
  });

  it("preserves natural order by default", () => {
    const rows = [
      { name: "c", value: 3 },
      { name: "a", value: 1 },
      { name: "b", value: 2 },
    ];
    const out = pivotForChart(rows, baseConfig());
    expect(out.map((r) => r.name)).toEqual(["c", "a", "b"]);
  });

  it("aggregates then sorts when groupBy is present", () => {
    const rows = [
      { region: "NA", sales: 10 },
      { region: "EU", sales: 5 },
      { region: "NA", sales: 20 },
      { region: "AS", sales: 7 },
    ];
    const out = pivotForChart(
      rows,
      baseConfig({
        x: { field: "region" },
        groupBy: "region",
        series: [{ field: "sales", agg: "sum" }],
        sortX: "value-desc",
      }),
    );
    expect(out).toEqual([
      { region: "NA", sales: 30 },
      { region: "AS", sales: 7 },
      { region: "EU", sales: 5 },
    ]);
  });
});
