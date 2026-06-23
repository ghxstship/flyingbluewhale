"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import {
  COMPLIANCE_RULE_STATES,
  COMPLIANCE_SEVERITIES,
  RULE_STATE_LABELS,
  SEVERITY_LABELS,
} from "@/lib/xmce_engine";
import { createRuleAction, updateRuleAction, type State } from "./actions";
import type { ComplianceRuleRow } from "../types";

export function RuleForm({ rule }: { rule?: ComplianceRuleRow }) {
  const action: (prev: State, fd: FormData) => Promise<State> = rule
    ? (prev, fd) => updateRuleAction(rule.id, prev, fd)
    : createRuleAction;

  return (
    <FormShell
      action={action}
      cancelHref={rule ? `/legend/engine/rules/${rule.id}` : "/legend/engine/rules"}
      submitLabel={rule ? "Save Rule" : "Create Rule"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Code"
          name="code"
          required
          maxLength={60}
          placeholder="e.g. SEC-001"
          defaultValue={rule?.code}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="rule-severity">
            Severity
          </label>
          <select
            id="rule-severity"
            name="severity"
            defaultValue={rule?.severity ?? "medium"}
            className="ps-input mt-1.5 w-full"
          >
            {COMPLIANCE_SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {SEVERITY_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Input label="Title" name="title" required maxLength={160} defaultValue={rule?.title} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Category"
          name="category"
          maxLength={80}
          placeholder="e.g. Security"
          defaultValue={rule?.category ?? ""}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="rule-state">
            State
          </label>
          <select
            id="rule-state"
            name="rule_state"
            defaultValue={rule?.rule_state ?? "draft"}
            className="ps-input mt-1.5 w-full"
          >
            {COMPLIANCE_RULE_STATES.map((s) => (
              <option key={s} value={s}>
                {RULE_STATE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="rule-description">
          Description
        </label>
        <textarea
          id="rule-description"
          name="description"
          rows={4}
          defaultValue={rule?.description ?? ""}
          className="ps-input mt-1.5 w-full"
          placeholder="What this rule checks for and why it matters."
        />
      </div>
    </FormShell>
  );
}
