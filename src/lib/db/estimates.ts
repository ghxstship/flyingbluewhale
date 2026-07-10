import "server-only";

/**
 * HP-14 — honest estimate totals.
 *
 * `estimates.subtotal_cost` / `estimates.total_with_markup` /
 * `estimate_lines.line_total` are stored derived columns with NO maintaining
 * writer anywhere: no trigger in any migration (only the updated_at touch),
 * and no app code inserts or updates `estimate_lines` at all. Console-created
 * estimates therefore carry the column defaults (0) forever, and any
 * externally-authored lines can silently desync the header.
 *
 * Read paths that DISPLAY estimate money now derive it from the live line
 * rows via this helper instead of trusting the frozen header:
 *   - subtotal = Σ quantity × unit_cost × (1 + waste_factor)
 *   - total    = Σ line_total, falling back per line to
 *                base × (1 + markup_pct) when line_total was never written
 * (markup_pct / waste_factor are stored as fractions — the detail page
 * renders `default_markup_pct * 100`%.)
 *
 * When an estimate has no lines, the stored header values are returned
 * unchanged — for console-created estimates those are the same 0 the page
 * showed before, and for externally-seeded headers without line detail the
 * header remains the only record. All values are MAJOR units (dollars),
 * matching the columns (numeric(14,2)).
 */

type EstimateHeader = {
  id: string;
  subtotal_cost: number | string | null;
  total_with_markup: number | string | null;
};

export type EstimateTotals = {
  /** Dollars. Σ line base cost, or the stored header when no lines exist. */
  subtotalCost: number;
  /** Dollars. Σ line totals, or the stored header when no lines exist. */
  totalWithMarkup: number;
  /** Number of estimate_lines rows backing the computed figures. */
  lineCount: number;
};

type LineRow = {
  estimate_id: string;
  quantity: number | string | null;
  unit_cost: number | string | null;
  waste_factor: number | string | null;
  markup_pct: number | string | null;
  line_total: number | string | null;
};

type EstimateLinesClient = {
  from: (table: "estimate_lines") => {
    select: (cols: string) => {
      eq: (
        col: string,
        v: string,
      ) => {
        in: (col: string, v: string[]) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
      };
    };
  };
};

export async function computeEstimateTotals(
  client: unknown,
  orgId: string,
  estimates: EstimateHeader[],
): Promise<Map<string, EstimateTotals>> {
  const out = new Map<string, EstimateTotals>();
  for (const e of estimates) {
    out.set(e.id, {
      subtotalCost: Number(e.subtotal_cost ?? 0),
      totalWithMarkup: Number(e.total_with_markup ?? 0),
      lineCount: 0,
    });
  }
  if (estimates.length === 0) return out;

  const { data } = await (client as EstimateLinesClient)
    .from("estimate_lines")
    .select("estimate_id, quantity, unit_cost, waste_factor, markup_pct, line_total")
    .eq("org_id", orgId)
    .in(
      "estimate_id",
      estimates.map((e) => e.id),
    );

  const sums = new Map<string, { subtotal: number; total: number; count: number }>();
  for (const raw of (data ?? []) as LineRow[]) {
    const acc = sums.get(raw.estimate_id) ?? { subtotal: 0, total: 0, count: 0 };
    acc.subtotal += lineBase(raw);
    acc.total += effectiveLineTotal(raw);
    acc.count += 1;
    sums.set(raw.estimate_id, acc);
  }
  for (const [id, s] of sums) {
    out.set(id, { subtotalCost: s.subtotal, totalWithMarkup: s.total, lineCount: s.count });
  }
  return out;
}

/** Line base cost in dollars: quantity × unit_cost × (1 + waste_factor). */
export function lineBase(l: Pick<LineRow, "quantity" | "unit_cost" | "waste_factor">): number {
  return Number(l.quantity ?? 0) * Number(l.unit_cost ?? 0) * (1 + Number(l.waste_factor ?? 0));
}

/**
 * The line's display total in dollars: the stored `line_total` when it was
 * actually written (non-zero), otherwise derived base × (1 + markup_pct).
 */
export function effectiveLineTotal(l: LineRow): number {
  const stored = Number(l.line_total ?? 0);
  if (stored !== 0) return stored;
  return lineBase(l) * (1 + Number(l.markup_pct ?? 0));
}
