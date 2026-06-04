"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createCustomRole, type State } from "./actions";

export function CustomRoleForm() {
  const t = useT();
  const [state, action, pending] = useActionState<State, FormData>(createCustomRole, null);
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (state === null) setOpen(false);
  }, [state]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          {t("console.people.roles.newRole", undefined, "+ New Role")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("console.people.roles.newCustomRole", undefined, "New custom role")}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-3">
          <Input
            label={t("console.people.roles.slugLabel", undefined, "Slug")}
            name="slug"
            required
            maxLength={60}
            placeholder="finance-reader"
            hint={t("console.people.roles.slugHint", undefined, "Lowercase, dashes ok. Used in API tokens.")}
          />
          <Input
            label={t("console.people.roles.labelLabel", undefined, "Label")}
            name="label"
            required
            maxLength={120}
            placeholder="Finance Reader"
          />
          <Input
            label={t("console.people.roles.descriptionLabel", undefined, "Description")}
            name="description"
            maxLength={400}
          />
          <Input
            label={t("console.people.roles.permissionsLabel", undefined, "Permissions")}
            name="permissions"
            hint={t(
              "console.people.roles.permissionsHint",
              undefined,
              "Comma-separated, e.g. invoices:read, expenses:read",
            )}
          />
          {state?.error && <p className="text-xs text-[var(--color-error)]">{state.error}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={pending}>
              {t("console.people.roles.createRole", undefined, "Create Role")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
