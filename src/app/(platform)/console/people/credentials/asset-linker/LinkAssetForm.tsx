"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { linkAssetAction, type State } from "./actions";

export function LinkAssetForm({
  credentials,
}: {
  credentials: {
    id: string;
    kind: string | null;
    number: string | null;
    crew_members?: { name?: string } | null;
  }[];
}) {
  const [state, action, pending] = useActionState<State, FormData>(linkAssetAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <div className="sm:col-span-1">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Credential</label>
        <select name="credential_id" required className="input-base mt-1.5 w-full">
          <option value="">— Select —</option>
          {credentials.map((c) => (
            <option key={c.id} value={c.id}>
              {(c.crew_members?.name ?? "Unnamed") +
                (c.kind ? ` · ${c.kind}` : "") +
                (c.number ? ` (${c.number})` : "")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Asset kind</label>
        <select name="asset_kind" defaultValue="nfc_tag" className="input-base mt-1.5 w-full">
          <option value="nfc_tag">NFC tag</option>
          <option value="rfid_card">RFID card</option>
          <option value="barcode">Barcode</option>
          <option value="qr_code">QR code</option>
        </select>
      </div>
      <div>
        <Input label="Serial" name="asset_serial" required maxLength={120} placeholder="e.g. 04:A2:B5:C0" />
      </div>
      {state?.error && (
        <p className="sm:col-span-3 text-xs text-[var(--color-error)]">{state.error}</p>
      )}
      <div className="sm:col-span-3 flex justify-end">
        <Button type="submit" loading={pending}>Link asset</Button>
      </div>
    </form>
  );
}
