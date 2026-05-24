"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { linkAssetAction, type State } from "./actions";

export function LinkAssetForm({
  assignments,
}: {
  assignments: {
    id: string;
    title: string | null;
    party_label: string;
  }[];
}) {
  const [state, action, pending] = useActionState<State, FormData>(linkAssetAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <div className="sm:col-span-1">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Credential Assignment</label>
        <select name="assignment_id" required className="input-base mt-1.5 w-full">
          <option value="">— Select —</option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.party_label} · {a.title ?? "Untitled"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Token Kind</label>
        <select name="kind" defaultValue="nfc" className="input-base mt-1.5 w-full">
          <option value="nfc">NFC tag</option>
          <option value="rfid">RFID card</option>
          <option value="barcode">Barcode</option>
          <option value="qr">QR code</option>
          <option value="wristband_serial">Wristband serial</option>
        </select>
      </div>
      <div>
        <Input label="Code" name="code" required maxLength={120} placeholder="e.g. 04:A2:B5:C0" />
      </div>
      {state?.error && <p className="text-xs text-[var(--color-error)] sm:col-span-3">{state.error}</p>}
      <div className="flex justify-end sm:col-span-3">
        <Button type="submit" loading={pending}>
          Bind Code
        </Button>
      </div>
    </form>
  );
}
