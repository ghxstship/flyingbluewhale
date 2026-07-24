"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import {
  COMPLIANCE_RULE_STATES,
  COMPLIANCE_SEVERITIES,
  RULE_STATE_LABELS,
  SEVERITY_LABELS,
} from "@/lib/xmce_engine";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createRuleAction, updateRuleAction, type State } from "./actions";
import type { ComplianceRuleRow } from "../types";

export function RuleForm({ rule }: { rule?: ComplianceRuleRow }) {
  const t = useT();
  const action: (prev: State, fd: FormData) => Promise<State> = rule
    ? (prev, fd) => updateRuleAction(rule.id, prev, fd)
    : createRuleAction;

  return (
    <FormShell
      action={action}
      cancelHref={rule ? `/legend/engine/rules/${rule.id}` : "/legend/engine/rules"}
      submitLabel={
        rule
          ? t("console.legend.engine.form.save", undefined, "Save Rule")
          : t("console.legend.engine.form.create", undefined, "Create Rule")
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.legend.engine.form.code", undefined, "Code")}
          name="code"
          required
          maxLength={60}
          placeholder={t("console.legend.engine.form.codePlaceholder", undefined, "e.g. SEC-001")}
          defaultValue={rule?.code}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="rule-severity">
            {t("console.legend.engine.form.severity", undefined, "Severity")}
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
      <Input
        label={t("console.legend.engine.form.title", undefined, "Title")}
        name="title"
        required
        maxLength={160}
        defaultValue={rule?.title}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("console.legend.engine.form.category", undefined, "Category")}
          name="category"
          maxLength={80}
          placeholder={t("console.legend.engine.form.categoryPlaceholder", undefined, "e.g. Security")}
          defaultValue={rule?.category ?? ""}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]" htmlFor="rule-state">
            {t("console.legend.engine.form.state", undefined, "State")}
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
          {t("console.legend.engine.form.description", undefined, "Description")}
        </label>
        <textarea
          id="rule-description"
          name="description"
          rows={4}
          defaultValue={rule?.description ?? ""}
          className="ps-input mt-1.5 w-full"
          placeholder={t(
            "console.legend.engine.form.descriptionPlaceholder",
            undefined,
            "What this rule checks for and why it matters.",
          )}
        />
      </div>
    </FormShell>
  );
}
