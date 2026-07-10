"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
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
  const t = useT();
  const [state, action, pending] = useActionState<State, FormData>(linkAssetAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <div className="sm:col-span-1">
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.people.credentials.assetLinker.form.assignmentLabel", undefined, "Credential Assignment")}
        </label>
        <select name="assignment_id" required className="ps-input mt-1.5 w-full">
          <option value="">
            {t("console.people.credentials.assetLinker.form.assignmentPlaceholder", undefined, "Select")}
          </option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.party_label} ·{" "}
              {a.title ?? t("console.people.credentials.assetLinker.form.untitled", undefined, "Untitled")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.people.credentials.assetLinker.form.tokenKindLabel", undefined, "Token Kind")}
        </label>
        <select name="kind" defaultValue="nfc" className="ps-input mt-1.5 w-full">
          <option value="nfc">{t("console.people.credentials.assetLinker.form.kind.nfc", undefined, "NFC tag")}</option>
          <option value="rfid">
            {t("console.people.credentials.assetLinker.form.kind.rfid", undefined, "RFID card")}
          </option>
          <option value="barcode">
            {t("console.people.credentials.assetLinker.form.kind.barcode", undefined, "Barcode")}
          </option>
          <option value="qr">{t("console.people.credentials.assetLinker.form.kind.qr", undefined, "QR code")}</option>
          <option value="wristband_serial">
            {t("console.people.credentials.assetLinker.form.kind.wristbandSerial", undefined, "Wristband serial")}
          </option>
        </select>
      </div>
      <div>
        <Input
          label={t("console.people.credentials.assetLinker.form.codeLabel", undefined, "Code")}
          name="code"
          required
          maxLength={120}
          placeholder={t("console.people.credentials.assetLinker.form.codePlaceholder", undefined, "e.g. 04:A2:B5:C0")}
        />
      </div>
      {state?.error && <p className="text-xs text-[var(--p-danger)] sm:col-span-3">{state.error}</p>}
      <div className="flex justify-end sm:col-span-3">
        <Button type="submit" loading={pending}>
          {t("console.people.credentials.assetLinker.form.submit", undefined, "Bind Code")}
        </Button>
      </div>
    </form>
  );
}
