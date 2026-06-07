"use client";

import { useId, useState, type InputHTMLAttributes } from "react";

interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "type" | "value" | "defaultValue" | "onChange"
> {
  /** Form-field name for the *cents* value submitted to the server. Hidden input. */
  name: string;
  /** Initial dollar amount (or null). Will be displayed as e.g. "27,500.00". */
  defaultCents?: number | null;
  label?: string;
  hint?: string;
  required?: boolean;
}

/**
 * MoneyInput — producer-friendly money entry.
 *
 * Renders a `$`-prefixed text input that accepts a dollar amount the way a
 * human types it ("27500", "27,500", "27500.50"), formats it on blur with
 * thousands separators + 2-decimal precision, and submits the canonical
 * integer cents value via a hidden `<input name={name}>` so server actions
 * receive the same shape they did before.
 *
 * Sea Trial FINDING-009: project edit asked for "budget_cents" raw — typing
 * 2,750,000 to mean $27,500 is producer-hostile. Prefer this for every
 * monetary field across Finance, Procurement, and Proposals.
 */
export function MoneyInput({ name, defaultCents, label, hint, required, ...rest }: MoneyInputProps) {
  const id = useId();
  const initialDollars = defaultCents != null ? (defaultCents / 100).toFixed(2) : "";
  const [display, setDisplay] = useState(formatDisplay(initialDollars));
  const [cents, setCents] = useState<string>(defaultCents != null ? String(defaultCents) : "");

  function onInput(value: string) {
    setDisplay(value);
    setCents(toCents(value));
  }

  function onBlur() {
    if (!display.trim()) {
      setDisplay("");
      setCents("");
      return;
    }
    const c = toCents(display);
    setCents(c);
    setDisplay(c ? formatFromCents(c) : "");
  }

  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-medium text-[var(--p-text-2)]">
          {label}
          {required && (
            <span aria-hidden="true" className="text-[var(--p-danger)]">
              {" "}
              *
            </span>
          )}
        </span>
      )}
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 start-0 flex items-center ps-3 text-sm text-[var(--p-text-2)]"
        >
          $
        </span>
        <input
          {...rest}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={display}
          onChange={(e) => onInput(e.target.value)}
          onBlur={onBlur}
          required={required}
          className="ps-input focus-ring w-full ps-7 font-mono text-sm"
          placeholder="0.00"
        />
      </div>
      {hint && <span className="text-[10px] text-[var(--p-text-2)]">{hint}</span>}
      {/* Hidden field carries the canonical cents integer to server actions. */}
      <input type="hidden" name={name} value={cents} />
    </label>
  );
}

function toCents(input: string): string {
  // Strip everything except digits, decimal point, and minus.
  const cleaned = input.replace(/[^\d.\-]/g, "");
  if (!cleaned) return "";
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return "";
  return String(Math.round(num * 100));
}

function formatFromCents(cents: string): string {
  const n = Number(cents) / 100;
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDisplay(dollars: string): string {
  if (!dollars) return "";
  const n = Number(dollars);
  if (!Number.isFinite(n)) return dollars;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
