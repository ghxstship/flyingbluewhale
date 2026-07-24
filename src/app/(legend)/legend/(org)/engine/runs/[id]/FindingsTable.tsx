"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/hooks/useToast";
import { Badge } from "@/components/ui/Badge";
import {
  COMPLIANCE_FINDING_STATES,
  FINDING_STATE_LABELS,
  FINDING_STATE_TONES,
  SEVERITY_LABELS,
  SEVERITY_TONES,
} from "@/lib/xmce_engine";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { ComplianceFindingRow } from "../../types";
import { setFindingStateAction } from "../actions";

export type FindingWithRule = ComplianceFindingRow & {
  rule_code: string;
  rule_title: string;
};

export function FindingsTable({ runId, findings }: { runId: string; findings: FindingWithRule[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const t = useT();

  function setState(findingId: string, next: (typeof COMPLIANCE_FINDING_STATES)[number]) {
    startTransition(async () => {
      const res = await setFindingStateAction(findingId, runId, next);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(t("console.legend.engine.run.findingUpdated", undefined, "Finding updated"));
      router.refresh();
    });
  }

  return (
    <div className="surface overflow-hidden">
      <table className="ps-table w-full">
        <thead>
          <tr>
            <th>{t("console.legend.engine.run.columns.rule", undefined, "Rule")}</th>
            <th>{t("console.legend.engine.run.columns.severity", undefined, "Severity")}</th>
            <th>{t("console.legend.engine.run.columns.detail", undefined, "Detail")}</th>
            <th>{t("console.legend.engine.run.columns.entity", undefined, "Entity")}</th>
            <th>{t("console.legend.engine.run.columns.status", undefined, "Status")}</th>
            <th className="text-right">{t("console.legend.engine.run.columns.triage", undefined, "Triage")}</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <tr key={f.id}>
              <td>
                <a
                  href={`/legend/engine/rules/${f.rule_id}`}
                  className="font-medium text-[var(--p-text-1)] hover:underline"
                >
                  {f.rule_code}
                </a>
                <div className="text-xs text-[var(--p-text-2)]">{f.rule_title}</div>
              </td>
              <td>
                <Badge variant={SEVERITY_TONES[f.severity]}>{SEVERITY_LABELS[f.severity]}</Badge>
              </td>
              <td className="text-sm text-[var(--p-text-1)]">{f.detail ?? "—"}</td>
              <td className="text-sm text-[var(--p-text-2)]">{f.entity_ref ?? "—"}</td>
              <td>
                <Badge variant={FINDING_STATE_TONES[f.finding_state]}>{FINDING_STATE_LABELS[f.finding_state]}</Badge>
              </td>
              <td className="text-right">
                <label className="sr-only" htmlFor={`finding-state-${f.id}`}>
                  {t("console.legend.engine.run.setStateFor", { code: f.rule_code }, `Set state for ${f.rule_code}`)}
                </label>
                <select
                  id={`finding-state-${f.id}`}
                  value={f.finding_state}
                  disabled={pending}
                  onChange={(e) => setState(f.id, e.target.value as (typeof COMPLIANCE_FINDING_STATES)[number])}
                  className="ps-input w-40 text-xs"
                >
                  {COMPLIANCE_FINDING_STATES.map((s) => (
                    <option key={s} value={s}>
                      {FINDING_STATE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
