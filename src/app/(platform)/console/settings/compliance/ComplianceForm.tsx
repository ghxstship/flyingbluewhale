"use client";

import * as React from "react";
import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/lib/hooks/useToast";
import { saveComplianceSettings, type State } from "./actions";

type Initial = {
  retention_audit_days?: number;
  retention_logs_days?: number;
  encryption_at_rest?: "on" | "off";
  dpa_signed?: "on" | "off";
  data_residency?: "us" | "eu" | "global";
};

export function ComplianceForm({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<State, FormData>(saveComplianceSettings, null);
  const toast = useToast();
  React.useEffect(() => {
    if (state?.saved) toast.success("Compliance settings saved");
    if (state?.error) toast.error(state.error);
  }, [state, toast]);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Audit-log retention (days)"
          name="retention_audit_days"
          type="number"
          defaultValue={initial.retention_audit_days ?? 365}
          min={30}
          max={3650}
        />
        <Input
          label="Application-log retention (days)"
          name="retention_logs_days"
          type="number"
          defaultValue={initial.retention_logs_days ?? 90}
          min={7}
          max={3650}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-md border border-[var(--border-color)] p-3">
          <div>
            <div className="text-sm font-medium">Encryption at rest</div>
            <div className="text-xs text-[var(--text-muted)]">AES-256 via Supabase</div>
          </div>
          <Switch name="encryption_at_rest" defaultChecked={initial.encryption_at_rest !== "off"} />
        </div>
        <div className="flex items-center justify-between rounded-md border border-[var(--border-color)] p-3">
          <div>
            <div className="text-sm font-medium">DPA signed</div>
            <div className="text-xs text-[var(--text-muted)]">GDPR data-processing agreement</div>
          </div>
          <Switch name="dpa_signed" defaultChecked={initial.dpa_signed === "on"} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Data residency</label>
        <select
          name="data_residency"
          defaultValue={initial.data_residency ?? "us"}
          className="input-base mt-1.5 w-full"
        >
          <option value="us">United States</option>
          <option value="eu">European Union</option>
          <option value="global">Global (any region)</option>
        </select>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>Save compliance settings</Button>
      </div>
    </form>
  );
}
