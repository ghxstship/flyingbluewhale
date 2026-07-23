"use client";

import * as React from "react";
import { useActionState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { addDomainAction, type State } from "./actions";

export function AddDomainForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(addDomainAction, null);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[220px] flex-1">
        <Input
          label={t("console.settings.domains.addForm.hostnameLabel", undefined, "Hostname")}
          name="hostname"
          placeholder="portal.example.com"
          required
        />
      </div>
      <div className="min-w-[160px]">
        <label htmlFor="purpose" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.settings.domains.addForm.purposeLabel", undefined, "Purpose")}
        </label>
        <select id="purpose" name="purpose" defaultValue="portal" className="ps-input mt-1.5 w-full">
          <option value="portal">{t("console.settings.domains.addForm.purposePortal", undefined, "Portal")}</option>
          <option value="marketing">
            {t("console.settings.domains.addForm.purposeMarketing", undefined, "Marketing")}
          </option>
          <option value="email">{t("console.settings.domains.addForm.purposeEmail", undefined, "Email")}</option>
        </select>
      </div>
      <Button type="submit" loading={pending}>
        {t("common.add", undefined, "Add")}
      </Button>
      {state && "error" in state && state.error && (
        <p className="basis-full text-xs text-[var(--p-danger)]">{state.error}</p>
      )}
    </form>
  );
}
