"use client";

import { useId, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  CONDITION_OPS,
  CONDITION_OP_LABELS,
  isConditionOp,
  opIsList,
  opIsNullary,
  type Condition,
  type ConditionOp,
  type ConditionRule,
} from "@/lib/automations/conditions";

/**
 * Per-step condition editor — the "Run when…" gate authored as field / operator
 * / value rows persisted into the step JSON's `condition` slot.
 *
 * Surfaces the common case of the JSON DSL in `src/lib/automations/conditions.ts`:
 * a single top-level group (`all` = match every row, `any` = match any row) of
 * leaf rules. Nested groups are still valid in the persisted JSON and evaluated
 * by the runner, but the visual editor only authors one level deep — matching
 * SmartSuite's condition builder.
 *
 * The runner reads the same `condition` object via `evaluateCondition`; an
 * empty rule list serializes to `null` so a step with no rows always runs.
 */

type GroupMode = "all" | "any";

export type ConditionEditorProps = {
  /** Current condition object (or null/undefined for "no condition"). */
  value: Condition | null | undefined;
  /** Emits the next condition object, or `null` when there are no rows. */
  onChange: (next: Condition | null) => void;
};

type ParsedState = {
  mode: GroupMode;
  rules: ConditionRule[];
};

/**
 * Coerce an arbitrary persisted `condition` into the flat editor state. A leaf
 * rule, an `all` group, or an `any` group all map cleanly; anything else
 * (nested, malformed) collapses to an empty `all` group so the editor never
 * throws on legacy/hand-edited JSON.
 */
function parseCondition(value: Condition | null | undefined): ParsedState {
  if (value == null || typeof value !== "object") return { mode: "all", rules: [] };
  if ("all" in value && Array.isArray(value.all)) {
    return { mode: "all", rules: value.all.filter(isLeafRule) };
  }
  if ("any" in value && Array.isArray(value.any)) {
    return { mode: "any", rules: value.any.filter(isLeafRule) };
  }
  if (isLeafRule(value)) return { mode: "all", rules: [value] };
  return { mode: "all", rules: [] };
}

function isLeafRule(c: unknown): c is ConditionRule {
  return (
    typeof c === "object" &&
    c !== null &&
    "field" in c &&
    "op" in c &&
    typeof (c as ConditionRule).field === "string" &&
    isConditionOp((c as ConditionRule).op)
  );
}

/** Serialize the flat editor state back into a `Condition` (or null if empty). */
function serialize(mode: GroupMode, rules: ConditionRule[]): Condition | null {
  if (rules.length === 0) return null;
  return mode === "all" ? { all: rules } : { any: rules };
}

function blankRule(): ConditionRule {
  return { field: "", op: "eq", value: "" };
}

export function ConditionEditor({ value, onChange }: ConditionEditorProps) {
  const modeId = useId();
  const { mode, rules } = useMemo(() => parseCondition(value), [value]);

  function emit(nextMode: GroupMode, nextRules: ConditionRule[]) {
    onChange(serialize(nextMode, nextRules));
  }

  function setMode(next: GroupMode) {
    emit(next, rules);
  }

  function addRule() {
    emit(mode, [...rules, blankRule()]);
  }

  function removeRule(index: number) {
    emit(
      mode,
      rules.filter((_, i) => i !== index),
    );
  }

  function updateRule(index: number, patch: Partial<ConditionRule>) {
    const next = rules.map((r, i) => (i === index ? applyPatch(r, patch) : r));
    emit(mode, next);
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rules.length === 0 ? (
        <p className="text-[11px] text-[var(--p-text-2)]">
          No condition — this step always runs. Add a rule to gate it.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <label htmlFor={modeId} className="text-[11px] font-medium text-[var(--p-text-2)]">
              Run when
            </label>
            <select
              id={modeId}
              value={mode}
              onChange={(e) => setMode(e.target.value === "any" ? "any" : "all")}
              className="ps-input focus-ring h-8 w-auto text-xs"
              aria-label="Match mode"
            >
              <option value="all">all rules match</option>
              <option value="any">any rule matches</option>
            </select>
          </div>

          <ul className="flex flex-col gap-2">
            {rules.map((rule, i) => (
              <li key={i} className="flex flex-wrap items-start gap-2">
                <RuleRow rule={rule} onChange={(patch) => updateRule(i, patch)} />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove rule ${i + 1}`}
                  onClick={() => removeRule(i)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div>
        <Button variant="secondary" size="sm" onClick={addRule}>
          <Plus size={14} aria-hidden="true" />
          Add condition
        </Button>
      </div>
    </div>
  );
}

/**
 * Apply an operator/field/value patch, normalizing `value` for the resulting
 * operator: nullary ops drop the operand, list ops keep an array, everything
 * else carries a scalar. Keeps the persisted JSON shape valid for the runner.
 */
function applyPatch(rule: ConditionRule, patch: Partial<ConditionRule>): ConditionRule {
  const merged: ConditionRule = { ...rule, ...patch };
  if (opIsNullary(merged.op)) {
    const { value: _drop, ...rest } = merged;
    void _drop;
    return rest as ConditionRule;
  }
  if (opIsList(merged.op)) {
    if (!Array.isArray(merged.value)) {
      merged.value = typeof merged.value === "string" ? splitList(merged.value) : [];
    }
    return merged;
  }
  // Scalar op — collapse any array operand back to a string.
  if (Array.isArray(merged.value)) merged.value = (merged.value as unknown[]).join(", ");
  if (merged.value === undefined) merged.value = "";
  return merged;
}

function splitList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function RuleRow({ rule, onChange }: { rule: ConditionRule; onChange: (patch: Partial<ConditionRule>) => void }) {
  const fieldId = useId();
  const opId = useId();
  const valueId = useId();
  const nullary = opIsNullary(rule.op);
  const list = opIsList(rule.op);
  const valueStr = Array.isArray(rule.value)
    ? (rule.value as unknown[]).join(", ")
    : rule.value == null
      ? ""
      : String(rule.value);

  return (
    <div className="flex flex-1 flex-wrap items-end gap-2">
      <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
        <label htmlFor={fieldId} className="text-[10px] font-medium text-[var(--p-text-2)]">
          Field
        </label>
        <Input
          inputId={fieldId}
          value={rule.field}
          placeholder="trigger.record.fields.title"
          onChange={(e) => onChange({ field: e.target.value })}
          className="font-mono text-xs"
        />
      </div>

      <div className="flex min-w-[9rem] flex-col gap-1">
        <label htmlFor={opId} className="text-[10px] font-medium text-[var(--p-text-2)]">
          Operator
        </label>
        <select
          id={opId}
          value={rule.op}
          onChange={(e) => onChange({ op: e.target.value as ConditionOp })}
          className="ps-input focus-ring h-9 text-xs"
          aria-label="Operator"
        >
          {CONDITION_OPS.map((op) => (
            <option key={op} value={op}>
              {CONDITION_OP_LABELS[op]}
            </option>
          ))}
        </select>
      </div>

      {!nullary && (
        <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
          <label htmlFor={valueId} className="text-[10px] font-medium text-[var(--p-text-2)]">
            {list ? "Value (comma-separated)" : "Value"}
          </label>
          <Input
            inputId={valueId}
            value={valueStr}
            placeholder={list ? "draft, review" : "value"}
            onChange={(e) => onChange({ value: list ? splitList(e.target.value) : e.target.value })}
            className="font-mono text-xs"
          />
        </div>
      )}
    </div>
  );
}
