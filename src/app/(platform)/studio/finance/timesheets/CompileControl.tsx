"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Gather a pay period's punches into timesheets.
 *
 * The operator's door to `compile_timesheets`. Safe to press repeatedly and
 * meant to be: the RPC is idempotent by construction, so an operator can
 * compile again as late offline punches replay without duplicating a sheet
 * or disturbing one that has already been submitted. The copy says so,
 * because a button people are afraid to press twice is a button that
 * doesn't get pressed when it should.
 */
export function CompileControl({ periods }: { periods: Array<{ id: string; label: string }> }) {
  const t = useT();
  const router = useRouter();
  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  if (periods.length === 0) {
    return (
      <p className="text-sm text-[var(--p-text-2)]">
        {t(
          "console.finance.timesheets.compile.noPeriods",
          undefined,
          "No open pay period. Open one before compiling — a period is the week a timesheet covers.",
        )}
      </p>
    );
  }

  async function compile() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/v1/pay-periods/${periodId}/compile`, {
        method: "POST",
        credentials: "same-origin",
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; data?: { message?: string }; error?: { message?: string } }
        | null;
      if (!res.ok || !json?.ok) {
        setMsg({ kind: "error", text: json?.error?.message ?? t("console.finance.timesheets.compile.failed", undefined, "Could not compile.") });
        return;
      }
      setMsg({ kind: "success", text: json.data?.message ?? "Compiled." });
      router.refresh();
    } catch {
      setMsg({ kind: "error", text: t("console.finance.timesheets.compile.offline", undefined, "Network error. Try again.") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="compile-period" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.finance.timesheets.compile.periodLabel", undefined, "Pay period")}
          </label>
          <select
            id="compile-period"
            className="ps-input mt-1.5 w-full"
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" onClick={compile} loading={busy} size="sm">
          {t("console.finance.timesheets.compile.submit", undefined, "Gather punches")}
        </Button>
      </div>
      <p className="text-[11px] text-[var(--p-text-3)]">
        {t(
          "console.finance.timesheets.compile.hint",
          undefined,
          "Safe to run again — late punches from the field get picked up, and sheets already submitted are left alone.",
        )}
      </p>
      {msg && <Alert kind={msg.kind === "error" ? "error" : "success"}>{msg.text}</Alert>}
    </div>
  );
}
