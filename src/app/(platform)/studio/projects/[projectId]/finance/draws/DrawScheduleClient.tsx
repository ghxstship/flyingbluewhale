"use client";

import * as React from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createDraw, deleteDraw, seedDefaultDraws, toggleDrawn, type State } from "./actions";
import { useT } from "@/lib/i18n/LocaleProvider";
import { formatMoney } from "@/lib/i18n/format";

import { useActionErrorResolver } from "@/lib/errors-client";
type DrawRow = {
  id: string;
  draw_name: string;
  trigger_label: string | null;
  trigger_phase: string | null;
  percentage: number | null;
  drawn: boolean;
  drawn_at: string | null;
  sort_order: number | null;
};

const INPUT_CLASS = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-sm";

function formatPct(p: number | null): string {
  if (p === null || p === undefined) return "—";
  return `${(p * 100).toFixed(1)}%`;
}

function formatMoneyCents(cents: number): string {
  return formatMoney(cents);
}

export function DrawScheduleClient({
  projectId,
  rows,
  totalBudgetCents,
  totalBudgetFormatted,
  phaseOptions,
}: {
  projectId: string;
  rows: DrawRow[];
  totalBudgetCents: number;
  totalBudgetFormatted: string;
  phaseOptions: string[];
}) {
  const t = useT();
  const seed = seedDefaultDraws.bind(null, projectId) as () => Promise<State>;
  const create = createDraw.bind(null, projectId) as (state: State, fd: FormData) => Promise<State>;
  const toggle = toggleDrawn.bind(null, projectId) as (drawId: string) => Promise<void>;
  const drop = deleteDraw.bind(null, projectId) as (drawId: string) => Promise<void>;

  const [createState, createAction] = useFormState(create, null);
  const resolveErr = useActionErrorResolver();
  const [pending, startTransition] = React.useTransition();

  const totalPct = rows.reduce((acc, r) => acc + (r.percentage ?? 0), 0);
  const totalDrawCents = rows.reduce((acc, r) => acc + Math.round(totalBudgetCents * (r.percentage ?? 0)), 0);
  const drawnCents = rows
    .filter((r) => r.drawn)
    .reduce((acc, r) => acc + Math.round(totalBudgetCents * (r.percentage ?? 0)), 0);

  return (
    <div className="space-y-6">
      {/* Totals strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="surface p-4">
          <div className="text-xs text-[var(--p-text-2)]">
            {t("console.draws.projectBudget", undefined, "Project budget")}
          </div>
          <div className="mt-1 font-mono text-lg font-semibold">{totalBudgetFormatted}</div>
        </div>
        <div className="surface p-4">
          <div className="text-xs text-[var(--p-text-2)]">
            {t("console.draws.totalScheduled", undefined, "Total scheduled")}
          </div>
          <div className="mt-1 font-mono text-lg font-semibold">
            {formatMoneyCents(totalDrawCents)}{" "}
            <span className="text-xs text-[var(--p-text-2)]">{formatPct(totalPct)}</span>
          </div>
        </div>
        <div className="surface p-4">
          <div className="text-xs text-[var(--p-text-2)]">
            {t("console.draws.drawnToDate", undefined, "Drawn to date")}
          </div>
          <div className="mt-1 font-mono text-lg font-semibold">{formatMoneyCents(drawnCents)}</div>
        </div>
      </div>

      {/* Existing draws */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("console.draws.draws", undefined, "Draws")}
          </h2>
          {rows.length === 0 && (
            <Button
              onClick={() =>
                startTransition(async () => {
                  await seed();
                })
              }
              disabled={pending}
            >
              {t("console.draws.seedDefault", undefined, "Seed 50 / 30 / 20 default")}
            </Button>
          )}
        </div>
        <div className="surface mt-2 overflow-hidden">
          <table className="ps-table w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">{t("console.draws.colDraw", undefined, "Draw")}</th>
                <th className="px-3 py-2 text-left">{t("console.draws.colTrigger", undefined, "Trigger")}</th>
                <th className="px-3 py-2 text-right">{t("console.draws.colPct", undefined, "%")}</th>
                <th className="px-3 py-2 text-right">{t("console.draws.colAmount", undefined, "Amount")}</th>
                <th className="px-3 py-2 text-center">{t("console.draws.colState", undefined, "Status")}</th>
                <th className="px-3 py-2 text-right">{t("console.draws.colActions", undefined, "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-sm text-[var(--p-text-2)]" colSpan={6}>
                    {t(
                      "console.draws.empty",
                      undefined,
                      "No draws scheduled yet. Seed the 50 / 30 / 20 default or add a custom draw below.",
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--p-border)]">
                    <td className="px-3 py-2 font-medium">{r.draw_name}</td>
                    <td className="px-3 py-2 text-xs text-[var(--p-text-2)]">
                      {r.trigger_phase ? <Badge variant="muted">{r.trigger_phase}</Badge> : null}{" "}
                      {r.trigger_label ?? ""}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{formatPct(r.percentage)}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatMoneyCents(Math.round(totalBudgetCents * (r.percentage ?? 0)))}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.drawn ? (
                        <Badge variant="success">{t("console.draws.drawn", undefined, "Drawn")}</Badge>
                      ) : (
                        <Badge variant="muted">{t("console.draws.pending", undefined, "Pending")}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={() => startTransition(async () => void (await toggle(r.id)))}
                        disabled={pending}
                      >
                        {r.drawn
                          ? t("console.draws.markPending", undefined, "Mark pending")
                          : t("console.draws.markDrawn", undefined, "Mark drawn")}
                      </button>
                      <span className="mx-2 text-[var(--p-text-2)]">·</span>
                      <button
                        type="button"
                        className="text-xs text-[var(--p-danger)] underline"
                        onClick={() => startTransition(async () => void (await drop(r.id)))}
                        disabled={pending}
                      >
                        {t("console.draws.delete", undefined, "Delete")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add custom draw */}
      <section>
        <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("console.draws.addHeading", undefined, "Add a draw")}
        </h2>
        <form action={createAction} className="surface mt-2 space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">
                {t("console.draws.drawName", undefined, "Draw name")}
              </span>
              <input name="draw_name" required maxLength={120} className={INPUT_CLASS} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">
                {t("console.draws.triggerLabel", undefined, "Trigger label")}
              </span>
              <input
                name="trigger_label"
                maxLength={200}
                className={INPUT_CLASS}
                placeholder={t("console.draws.triggerPlaceholder", undefined, "e.g. Phase 3 · Advance / contracts")}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">
                {t("console.draws.triggerPhase", undefined, "Trigger phase")}
              </span>
              <select name="trigger_phase" className={INPUT_CLASS} defaultValue="">
                <option value="">—</option>
                {phaseOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">
                {t("console.draws.percentage", undefined, "Percentage")}
              </span>
              <input
                name="percentage"
                required
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder={t("console.draws.pctPlaceholder", undefined, "50 or 0.5")}
                className={INPUT_CLASS}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--p-text-2)]">
                {t("console.draws.sortOrder", undefined, "Sort order")}
              </span>
              <input name="sort_order" type="number" defaultValue={rows.length + 1} className={INPUT_CLASS} />
            </label>
          </div>
          {createState?.error && <p className="text-xs text-[var(--p-danger)]">{resolveErr(createState.error)}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {t("console.draws.addDraw", undefined, "Add draw")}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
