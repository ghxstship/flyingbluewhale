"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  MEAL_PERIODS,
  MEAL_PERIOD_LABEL,
  deriveMealSummary,
  type MealPeriod,
} from "@/lib/db/catering-summary";
import { submitAdvanceCart, type CartSubmitState } from "./actions";

export type CartCatalogItem = {
  id: string;
  kind: string;
  code: string;
  name: string;
  /** "Credential · AAA" — Category · Type, derived from kind + name. */
  label: string;
};

export type CartPerson = {
  crewMemberId: string;
  name: string;
  contractStart: string | null;
  contractEnd: string | null;
};

type CartLine = {
  key: string;
  item: CartCatalogItem;
  startsOn: string;
  endsOn: string;
  mealPeriods: MealPeriod[];
  everyContractDay: boolean;
};

/**
 * Client half of the Advance Cart. All cart state lives here — nothing is
 * persisted until Review & Submit posts the whole batch to one server
 * action. The cart is per-person: switching the person re-defaults every
 * line's date range to the new contract window.
 */
export function CartClient({
  projectId,
  items,
  people,
}: {
  projectId: string;
  items: CartCatalogItem[];
  people: CartPerson[];
}) {
  const t = useT();
  const [personId, setPersonId] = useState(people[0]?.crewMemberId ?? "");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [state, formAction, pending] = useActionState<CartSubmitState, FormData>(
    submitAdvanceCart.bind(null, projectId),
    null,
  );

  const person = people.find((p) => p.crewMemberId === personId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.label} ${i.code}`.toLowerCase().includes(q));
  }, [items, query]);

  function addItem(item: CartCatalogItem) {
    setLines((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        item,
        startsOn: person?.contractStart ?? "",
        endsOn: person?.contractEnd ?? "",
        mealPeriods: item.kind === "catering" ? ["lunch"] : [],
        everyContractDay: true,
      },
    ]);
  }

  function patchLine(key: string, patch: Partial<CartLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function switchPerson(nextId: string) {
    setPersonId(nextId);
    const next = people.find((p) => p.crewMemberId === nextId);
    // The cart is per-person — carried-over lines re-default to the new
    // contract window so no line silently keeps the previous person's dates.
    setLines((prev) => prev.map((l) => ({ ...l, startsOn: next?.contractStart ?? "", endsOn: next?.contractEnd ?? "" })));
  }

  const payload = useMemo(
    () =>
      JSON.stringify({
        crew_member_id: personId,
        lines: lines.map((l) => ({
          catalog_item_id: l.item.id,
          starts_on: l.startsOn || null,
          ends_on: l.endsOn || null,
          meal_periods: l.item.kind === "catering" ? l.mealPeriods : [],
          every_contract_day: l.everyContractDay,
        })),
      }),
    [personId, lines],
  );

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* ── Catalog picker ─────────────────────────────────────────────── */}
      <section className="surface flex min-h-0 flex-col p-5">
        <h3 className="text-sm font-semibold tracking-wider uppercase">
          {t("console.projects.advancing.cart.catalogTitle", undefined, "Master Catalog")}
        </h3>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("console.projects.advancing.cart.searchPlaceholder", undefined, "Search Catalog…")}
          aria-label={t("console.projects.advancing.cart.searchLabel", undefined, "Search Catalog")}
          className="ps-input ps-input--sm mt-3 w-full"
        />
        <ul className="mt-3 max-h-[28rem] divide-y divide-[var(--p-border)] overflow-y-auto">
          {filtered.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[var(--p-text-1)]">{item.label}</div>
                <div className="ps-id text-[11px] text-[var(--p-text-3)]">{item.code}</div>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => addItem(item)}>
                <Plus size={13} aria-hidden="true" />
                {t("console.projects.advancing.cart.add", undefined, "Add")}
              </Button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-6 text-center text-xs text-[var(--p-text-2)]">
              {t("console.projects.advancing.cart.noMatches", undefined, "No Catalog Items Match")}
            </li>
          )}
        </ul>
      </section>

      {/* ── Cart ───────────────────────────────────────────────────────── */}
      <section className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold tracking-wider uppercase">
            {t(
              "console.projects.advancing.cart.cartTitle",
              { count: lines.length },
              `Cart · ${lines.length} ${lines.length === 1 ? "Line" : "Lines"}`,
            )}
          </h3>
          <label className="flex items-center gap-2 text-xs text-[var(--p-text-2)]">
            {t("console.projects.advancing.cart.personLabel", undefined, "Person")}
            <select
              value={personId}
              onChange={(e) => switchPerson(e.target.value)}
              className="ps-input ps-input--sm"
            >
              {people.map((p) => (
                <option key={p.crewMemberId} value={p.crewMemberId}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {lines.length === 0 ? (
          <EmptyState
            size="compact"
            icon={<ShoppingCart size={24} />}
            title={t("console.projects.advancing.cart.emptyCartTitle", undefined, "Cart Is Empty")}
            description={t(
              "console.projects.advancing.cart.emptyCartDescription",
              undefined,
              "Add items from the catalog. Credentials, vehicles, catering.",
            )}
          />
        ) : (
          <ul className="mt-4 space-y-3">
            {lines.map((line) => {
              const isCatering = line.item.kind === "catering";
              const summary = isCatering
                ? deriveMealSummary({
                    meal_periods: line.mealPeriods,
                    starts_on: line.startsOn || null,
                    ends_on: line.endsOn || null,
                    every_contract_day: line.everyContractDay,
                    excluded_dates: [],
                  })
                : null;
              return (
                <li key={line.key} className="rounded-[var(--p-r-md)] border border-[var(--p-border)] p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-[var(--p-text-1)]">{line.item.label}</div>
                    </div>
                    <Badge variant="brand">{t("console.projects.advancing.cart.inCart", undefined, "In Cart")}</Badge>
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                      aria-label={t(
                        "console.projects.advancing.cart.removeLine",
                        { item: line.item.label },
                        `Remove ${line.item.label}`,
                      )}
                      className="text-[var(--p-text-3)] hover:text-[var(--p-danger)]"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <label className="text-[11px] font-medium text-[var(--p-text-2)]">
                      {t("console.projects.advancing.cart.startLabel", undefined, "Start")}
                      <input
                        type="date"
                        value={line.startsOn}
                        onChange={(e) => patchLine(line.key, { startsOn: e.target.value })}
                        className="ps-input ps-input--sm mt-1 block"
                      />
                    </label>
                    <label className="text-[11px] font-medium text-[var(--p-text-2)]">
                      {t("console.projects.advancing.cart.endLabel", undefined, "End")}
                      <input
                        type="date"
                        value={line.endsOn}
                        onChange={(e) => patchLine(line.key, { endsOn: e.target.value })}
                        className="ps-input ps-input--sm mt-1 block"
                      />
                    </label>
                  </div>
                  {isCatering && (
                    <div className="mt-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {MEAL_PERIODS.map((p) => {
                          const on = line.mealPeriods.includes(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              aria-pressed={on}
                              onClick={() =>
                                patchLine(line.key, {
                                  mealPeriods: on
                                    ? line.mealPeriods.filter((m) => m !== p)
                                    : [...line.mealPeriods, p],
                                })
                              }
                              className={
                                on
                                  ? "rounded-full border border-[var(--p-accent)] px-3 py-1 text-xs font-semibold text-[var(--p-accent-text)]"
                                  : "rounded-full border border-[var(--p-border)] px-3 py-1 text-xs text-[var(--p-text-2)] hover:border-[var(--p-text-3)]"
                              }
                            >
                              {MEAL_PERIOD_LABEL[p]}
                            </button>
                          );
                        })}
                        <label className="flex items-center gap-1.5 text-xs text-[var(--p-text-2)]">
                          <input
                            type="checkbox"
                            checked={line.everyContractDay}
                            onChange={(e) => patchLine(line.key, { everyContractDay: e.target.checked })}
                          />
                          {t("console.projects.advancing.cart.everyContractDay", undefined, "Every Contract Day")}
                        </label>
                      </div>
                      {summary && <div className="text-xs text-[var(--p-text-2)]">{summary.label}</div>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <form action={formAction} className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--p-border)] pt-4">
          <input type="hidden" name="payload" value={payload} />
          <span className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.projects.advancing.cart.datesNote",
              undefined,
              "Dates Default To The Contract Range",
            )}
          </span>
          <div className="flex items-center gap-3">
            {state?.error && (
              <span role="alert" className="text-xs text-[var(--p-danger-text,var(--p-danger))]">
                {state.error}
              </span>
            )}
            <Button type="submit" disabled={pending || !person || lines.length === 0} loading={pending}>
              {t("console.projects.advancing.cart.submit", undefined, "Review & Submit Advance")}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
