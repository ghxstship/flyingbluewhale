"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createCommittee, createPolicy, type CommitteeState, type PolicyState } from "./actions";

export function CommitteeForm() {
  const t = useT();
  const [state, action, pending] = useActionState<CommitteeState, FormData>(createCommittee, null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (state === null) setOpen(false);
  }, [state]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          {t("console.settings.governance.forms.committee.trigger", undefined, "+ Committee")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("console.settings.governance.forms.committee.title", undefined, "New Committee")}
          </DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <Input
            label={t("console.settings.governance.forms.committee.name", undefined, "Name")}
            name="name"
            required
            maxLength={120}
          />
          <div>
            <label htmlFor="cadence" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.governance.forms.committee.cadenceLabel", undefined, "Cadence")}
            </label>
            <select id="cadence" name="cadence" defaultValue="monthly" className="ps-input mt-1.5 w-full">
              <option value="weekly">
                {t("console.settings.governance.forms.committee.cadence.weekly", undefined, "Weekly")}
              </option>
              <option value="biweekly">
                {t("console.settings.governance.forms.committee.cadence.biweekly", undefined, "Biweekly")}
              </option>
              <option value="monthly">
                {t("console.settings.governance.forms.committee.cadence.monthly", undefined, "Monthly")}
              </option>
              <option value="ad_hoc">
                {t("console.settings.governance.forms.committee.cadence.adHoc", undefined, "Ad hoc")}
              </option>
            </select>
          </div>
          <div>
            <label htmlFor="charter" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.governance.forms.committee.charter", undefined, "Charter")}
            </label>
            <textarea id="charter" name="charter" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
          </div>
          {state?.error && <p className="text-xs text-[var(--p-danger)]">{state.error}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={pending}>
              {t("common.create", undefined, "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PolicyForm() {
  const t = useT();
  const [state, action, pending] = useActionState<PolicyState, FormData>(createPolicy, null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (state === null) setOpen(false);
  }, [state]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          {t("console.settings.governance.forms.policy.trigger", undefined, "+ Policy")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("console.settings.governance.forms.policy.title", undefined, "New Policy")}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <Input
            label={t("console.settings.governance.forms.policy.name", undefined, "Name")}
            name="name"
            required
            maxLength={160}
          />
          <div>
            <label htmlFor="category" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.governance.forms.policy.categoryLabel", undefined, "Category")}
            </label>
            <select id="category" name="category" defaultValue="operations" className="ps-input mt-1.5 w-full">
              <option value="finance">
                {t("console.settings.governance.forms.policy.category.finance", undefined, "Finance")}
              </option>
              <option value="safety">
                {t("console.settings.governance.forms.policy.category.safety", undefined, "Safety")}
              </option>
              <option value="hr">{t("console.settings.governance.forms.policy.category.hr", undefined, "HR")}</option>
              <option value="data">
                {t("console.settings.governance.forms.policy.category.data", undefined, "Data")}
              </option>
              <option value="operations">
                {t("console.settings.governance.forms.policy.category.operations", undefined, "Operations")}
              </option>
            </select>
          </div>
          {state?.error && <p className="text-xs text-[var(--p-danger)]">{state.error}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={pending}>
              {t("common.create", undefined, "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
