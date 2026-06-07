"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createApiKeyAction, type CreateState } from "./actions";

export function CreateApiKeyForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState<CreateState, FormData>(createApiKeyAction, null);
  const [open, setOpen] = React.useState(false);
  const toast = useToast();

  // When the secret comes back, surface a copy-this-once panel.
  const secret = state && "secret" in state ? state.secret : undefined;

  function copy() {
    if (!secret) return;
    void navigator.clipboard.writeText(secret).then(() => {
      toast.success(t("console.settings.api.copiedToast", undefined, "Copied to clipboard"));
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          {t("console.settings.api.newKey", undefined, "+ New Key")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("console.settings.api.createTitle", undefined, "Create API key")}</DialogTitle>
          <DialogDescription>
            {t(
              "console.settings.api.createDescription",
              undefined,
              "We will show the secret exactly once — store it somewhere safe.",
            )}
          </DialogDescription>
        </DialogHeader>
        {secret ? (
          <div className="space-y-3">
            <div className="rounded-md border border-[var(--p-border)] bg-[var(--p-surface-2)] p-3">
              <code className="font-mono text-xs break-all">{secret}</code>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={copy}>
                {t("common.copy", undefined, "Copy")}
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                {t("common.done", undefined, "Done")}
              </Button>
            </div>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
            <Input
              label={t("common.name", undefined, "Name")}
              name="name"
              required
              maxLength={120}
              placeholder={t("console.settings.api.namePlaceholder", undefined, "e.g. CI bot")}
            />
            <Input
              label={t("console.settings.api.scopesLabel", undefined, "Scopes")}
              name="scopes"
              hint={t(
                "console.settings.api.scopesHint",
                undefined,
                "Comma-separated; leave blank for full access. Capability strings — projects:read, projects:write, tasks:write, deliverables:read, invoices:read, etc.",
              )}
            />
            <details className="rounded-md border border-[var(--p-border)] bg-[var(--p-surface-2)] p-2 text-xs">
              <summary className="cursor-pointer text-[var(--p-text-2)]">
                {t("console.settings.api.commonScopeSets", undefined, "Common scope sets")}
              </summary>
              <ul className="mt-2 space-y-1 font-mono">
                <li>
                  <code className="text-[var(--p-text-2)]">projects:read, tasks:read</code>{" "}
                  {t("console.settings.api.scopeReadOnly", undefined, "— read-only reporter")}
                </li>
                <li>
                  <code className="text-[var(--p-text-2)]">tasks:write, time:write</code>{" "}
                  {t("console.settings.api.scopeFieldClockIn", undefined, "— field clock-in")}
                </li>
                <li>
                  <code className="text-[var(--p-text-2)]">deliverables:read, deliverables:write</code>{" "}
                  {t("console.settings.api.scopeAdvancing", undefined, "— advancing pipeline")}
                </li>
                <li>
                  <code className="text-[var(--p-text-2)]">
                    {t("console.settings.api.scopeBlank", undefined, "(blank)")}
                  </code>{" "}
                  {t("console.settings.api.scopeFullAccess", undefined, "— full access of the issuing user")}
                </li>
              </ul>
            </details>
            {state && "error" in state && state.error && (
              <p className="text-xs text-[var(--p-danger)]">{state.error}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t("common.cancel", undefined, "Cancel")}
              </Button>
              <Button type="submit" loading={pending}>
                {t("console.settings.api.generateKey", undefined, "Generate key")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
