"use client";

import { useCallback } from "react";
import { Plus, Trash2, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Condition, ConditionOp, ConditionRule } from "@/lib/automations/conditions";

/**
 * ConditionBuilder — visual editor for the `Condition` JSON DSL.
 *
 * Rendered inside `<StepCard>` (P4.2) as a collapsible "Run when…" section,
 * but the component is fully standalone so a future polish pass can plumb
 * it into the step card without changing this file.
 *
 * Per [SmartSuite Automation Conditions](https://help.smartsuite.com/en/articles/6464896-automation-conditions).
 *
 * UX:
 * - Top-level toggle: "When ALL of these are true" / "When ANY of these are true"
 * - List of rules (field-path picker + op select + value input)
 * - "+ Add condition" / "+ Add nested group" buttons
 * - Per-rule delete button
 * - Ops with no operand (`is_empty`, `is_true`, etc.) hide the value input
 *
 * The component is uncontrolled — it always emits the full new tree to
 * `onChange`. Pass `null` to indicate "no condition" (the runner treats
 * that as vacuously true).
 */

// ---------------------------------------------------------------------------
// Op metadata
// ---------------------------------------------------------------------------

type OpMeta = {
  op: ConditionOp;
  label: string;
  /** Whether this op consumes the `value` operand. */
  takesOperand: boolean;
  /** Hint for the operand input — text/number/array/regex. */
  operandHint?: "text" | "number" | "list" | "regex";
};

const OPS: OpMeta[] = [
  { op: "eq", label: "Equals", takesOperand: true, operandHint: "text" },
  { op: "neq", label: "Does Not Equal", takesOperand: true, operandHint: "text" },
  { op: "contains", label: "Contains", takesOperand: true, operandHint: "text" },
  { op: "not_contains", label: "Does Not Contain", takesOperand: true, operandHint: "text" },
  { op: "starts_with", label: "Starts With", takesOperand: true, operandHint: "text" },
  { op: "ends_with", label: "Ends With", takesOperand: true, operandHint: "text" },
  { op: "gt", label: "Greater Than", takesOperand: true, operandHint: "number" },
  { op: "gte", label: "≥", takesOperand: true, operandHint: "number" },
  { op: "lt", label: "Less Than", takesOperand: true, operandHint: "number" },
  { op: "lte", label: "≤", takesOperand: true, operandHint: "number" },
  { op: "in", label: "Is One Of", takesOperand: true, operandHint: "list" },
  { op: "not_in", label: "Is Not One Of", takesOperand: true, operandHint: "list" },
  { op: "is_empty", label: "Is Empty", takesOperand: false },
  { op: "is_not_empty", label: "Is Not Empty", takesOperand: false },
  { op: "is_true", label: "Is True", takesOperand: false },
  { op: "is_false", label: "Is False", takesOperand: false },
  { op: "is_before", label: "Is Before", takesOperand: true, operandHint: "text" },
  { op: "is_after", label: "Is After", takesOperand: true, operandHint: "text" },
  { op: "matches", label: "Matches Regex", takesOperand: true, operandHint: "regex" },
];

const OP_BY_KEY: Record<string, OpMeta> = Object.fromEntries(OPS.map((o) => [o.op, o]));

// ---------------------------------------------------------------------------
// Tree helpers
// ---------------------------------------------------------------------------

type Group = { all: Condition[] } | { any: Condition[] };

function isGroup(c: Condition | null | undefined): c is Group {
  return !!c && typeof c === "object" && ("all" in c || "any" in c);
}

function isAll(g: Group): g is { all: Condition[] } {
  return "all" in g;
}

function emptyRule(fieldDefault: string): ConditionRule {
  return { field: fieldDefault, op: "eq", value: "" };
}

function rootGroup(value: Condition | null, fieldDefault: string): Group {
  if (value && isGroup(value)) return value;
  if (value) return { all: [value] };
  return { all: [emptyRule(fieldDefault)] };
}

// ---------------------------------------------------------------------------
// Operand parsing — list and number ops need real types so the evaluator
// behaves as expected. Strings stay strings.
// ---------------------------------------------------------------------------

function parseOperand(raw: string, hint: OpMeta["operandHint"]): unknown {
  if (hint === "list") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (hint === "number") {
    if (raw.trim() === "") return raw;
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }
  return raw;
}

function operandToString(value: unknown, hint: OpMeta["operandHint"]): string {
  if (value == null) return "";
  if (hint === "list" && Array.isArray(value)) return (value as unknown[]).join(", ");
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// ---------------------------------------------------------------------------
// Recursive group editor
// ---------------------------------------------------------------------------

type GroupEditorProps = {
  group: Group;
  onChange: (next: Group) => void;
  onDelete?: () => void;
  fieldPaths: string[];
  fieldDefault: string;
  depth: number;
};

function GroupEditor({ group, onChange, onDelete, fieldPaths, fieldDefault, depth }: GroupEditorProps) {
  const conditions = isAll(group) ? group.all : group.any;
  const mode: "all" | "any" = isAll(group) ? "all" : "any";

  const setMode = (next: "all" | "any") => {
    onChange(next === "all" ? { all: conditions } : { any: conditions });
  };

  const updateAt = (idx: number, next: Condition) => {
    const copy = [...conditions];
    copy[idx] = next;
    onChange(mode === "all" ? { all: copy } : { any: copy });
  };

  const removeAt = (idx: number) => {
    const copy = conditions.filter((_, i) => i !== idx);
    onChange(mode === "all" ? { all: copy } : { any: copy });
  };

  const addRule = () => {
    onChange(
      mode === "all"
        ? { all: [...conditions, emptyRule(fieldDefault)] }
        : { any: [...conditions, emptyRule(fieldDefault)] },
    );
  };

  const addGroup = () => {
    const child: Group = { all: [emptyRule(fieldDefault)] };
    onChange(mode === "all" ? { all: [...conditions, child] } : { any: [...conditions, child] });
  };

  return (
    <div className="surface-inset rounded border border-[var(--border-color)] p-3 text-sm" data-depth={depth}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">When</span>
          <select
            className="input-base text-xs"
            value={mode}
            onChange={(e) => setMode(e.target.value === "all" ? "all" : "any")}
            aria-label="Match mode"
          >
            <option value="all">ALL of these are true</option>
            <option value="any">ANY of these are true</option>
          </select>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete group"
            className="text-[var(--text-muted)] hover:text-[var(--color-error)]"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {conditions.length === 0 && <p className="text-xs text-[var(--text-muted)]">No conditions yet.</p>}
        {conditions.map((c, i) => {
          if (isGroup(c)) {
            return (
              <GroupEditor
                key={i}
                group={c}
                depth={depth + 1}
                fieldPaths={fieldPaths}
                fieldDefault={fieldDefault}
                onChange={(next) => updateAt(i, next)}
                onDelete={() => removeAt(i)}
              />
            );
          }
          return (
            <RuleEditor
              key={i}
              rule={c as ConditionRule}
              fieldPaths={fieldPaths}
              onChange={(next) => updateAt(i, next)}
              onDelete={() => removeAt(i)}
            />
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={addRule}>
          <Plus size={12} /> Add Condition
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={addGroup}>
          <FolderTree size={12} /> Add Nested Group
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leaf rule editor
// ---------------------------------------------------------------------------

type RuleEditorProps = {
  rule: ConditionRule;
  fieldPaths: string[];
  onChange: (next: ConditionRule) => void;
  onDelete: () => void;
};

function RuleEditor({ rule, fieldPaths, onChange, onDelete }: RuleEditorProps) {
  const opMeta = OP_BY_KEY[rule.op] ?? OPS[0];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] p-2">
      <input
        list="condition-field-paths"
        className="input-base min-w-0 flex-[2] font-mono text-xs"
        value={rule.field}
        onChange={(e) => onChange({ ...rule, field: e.target.value })}
        placeholder="trigger.field.path"
        aria-label="Field path"
      />
      <datalist id="condition-field-paths">
        {fieldPaths.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <select
        className="input-base flex-1 text-xs"
        value={rule.op}
        onChange={(e) => {
          const nextOp = e.target.value as ConditionOp;
          const nextMeta = OP_BY_KEY[nextOp];
          // When swapping to/from a no-operand op, drop the value to avoid
          // stale cruft surviving the round-trip.
          if (nextMeta && !nextMeta.takesOperand) {
            const { value: _drop, ...rest } = rule;
            void _drop;
            onChange({ ...rest, op: nextOp });
          } else {
            onChange({ ...rule, op: nextOp });
          }
        }}
        aria-label="Operator"
      >
        {OPS.map((o) => (
          <option key={o.op} value={o.op}>
            {o.label}
          </option>
        ))}
      </select>

      {opMeta.takesOperand && (
        <input
          className="input-base flex-[2] text-xs"
          value={operandToString(rule.value, opMeta.operandHint)}
          onChange={(e) => onChange({ ...rule, value: parseOperand(e.target.value, opMeta.operandHint) })}
          placeholder={
            opMeta.operandHint === "list"
              ? "value1, value2"
              : opMeta.operandHint === "number"
                ? "0"
                : opMeta.operandHint === "regex"
                  ? "^pattern$"
                  : "value"
          }
          aria-label="Value"
        />
      )}

      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete condition"
        className="ml-auto text-[var(--text-muted)] hover:text-[var(--color-error)]"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type ConditionBuilderProps = {
  value: Condition | null;
  onChange: (next: Condition | null) => void;
  /**
   * Available field paths for the dropdown autocomplete (e.g.
   * `trigger.foo.bar`, `step.0.output.id`). Provided as a `<datalist>` so
   * authors can pick or type freely.
   */
  fieldPaths: string[];
};

export function ConditionBuilder({ value, onChange, fieldPaths }: ConditionBuilderProps) {
  const fieldDefault = fieldPaths[0] ?? "trigger.";
  const root = rootGroup(value, fieldDefault);

  const handleChange = useCallback(
    (next: Group) => {
      // Empty group collapses to `null` so the runner short-circuits the
      // condition gate — saves a JSON round-trip and matches "no condition"
      // semantics in the DSL.
      const conds = isAll(next) ? next.all : next.any;
      if (conds.length === 0) {
        onChange(null);
        return;
      }
      onChange(next);
    },
    [onChange],
  );

  const clearAll = () => onChange(null);

  return (
    <div className="space-y-2">
      <GroupEditor group={root} onChange={handleChange} fieldPaths={fieldPaths} fieldDefault={fieldDefault} depth={0} />
      {value !== null && (
        <button
          type="button"
          onClick={clearAll}
          className="text-[10px] tracking-wide text-[var(--text-muted)] uppercase hover:text-[var(--color-error)]"
        >
          Clear All Conditions
        </button>
      )}
    </div>
  );
}
