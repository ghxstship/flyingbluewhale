"use client";

import { useActionState, useState } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useT } from "@/lib/i18n/LocaleProvider";
import { LogoUploader } from "@/components/branding/LogoUploader";
import { updateClientBrandingAction, type ClientBrandingState } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
type Initial = {
  clientId: string;
  clientName: string;
  logoUrl: string;
  accentColor: string;
  accentForeground: string;
  secondaryColor: string;
};

export function ClientBrandingForm({ initial }: { initial: Initial }) {
  const t = useT();
  const resolveErr = useActionErrorResolver();
  const [state, formAction, pending] = useActionState<ClientBrandingState, FormData>(async (prev, fd) => {
    const result = await updateClientBrandingAction(initial.clientId, prev, fd);
    if (result?.ok) toast.success(t("console.clients.branding.savedToast", undefined, "Client branding saved"));
    else if (result?.error) toast.error(resolveErr(result.error));
    return result;
  }, null);

  const [accent, setAccent] = useState(initial.accentColor || "#000000");
  const [foreground, setForeground] = useState(initial.accentForeground || "#ffffff");
  const [secondary, setSecondary] = useState(initial.secondaryColor || "#666666");

  return (
    <form action={formAction} className="space-y-5">
      <section className="surface p-5">
        <h3 className="text-sm font-semibold">{t("console.clients.branding.identity.title", undefined, "Client identity")}</h3>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "console.clients.branding.identity.description",
            undefined,
            "The client logo appears in the proposal co-brand lockup and the invoice bill-to. Upload or paste an HTTPS URL.",
          )}
        </p>
        <div className="mt-4">
          <LogoUploader
            name="logoUrl"
            scope="client"
            initialUrl={initial.logoUrl}
            label={t("console.clients.branding.logoLabel", { name: initial.clientName }, `${initial.clientName} logo`)}
          />
        </div>
      </section>

      <section className="surface p-5">
        <h3 className="text-sm font-semibold">{t("console.clients.branding.color.title", undefined, "Color")}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ColorField label={t("console.clients.branding.accentLabel", undefined, "Accent")} name="accentColor" value={accent} onChange={setAccent} />
          <ColorField label={t("console.clients.branding.foregroundLabel", undefined, "Text on accent")} name="accentForeground" value={foreground} onChange={setForeground} />
          <ColorField label={t("console.clients.branding.secondaryLabel", undefined, "Secondary")} name="secondaryColor" value={secondary} onChange={setSecondary} />
        </div>
      </section>

      <section className="surface p-5" style={{ ["--p-accent" as string]: accent, ["--p-accent-contrast" as string]: foreground }}>
        <h3 className="text-sm font-semibold">{t("console.clients.branding.preview.title", undefined, "Preview")}</h3>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded px-3 py-1 text-xs font-semibold" style={{ background: accent, color: foreground }}>
            {initial.clientName}
          </span>
          <span className="text-xs" style={{ color: secondary }}>
            {t("console.clients.branding.preview.sample", undefined, "Secondary accent sample")}
          </span>
        </div>
      </section>

      {state?.error ? <Alert kind="error">{resolveErr(state.error)}</Alert> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving", undefined, "Saving…") : t("console.clients.branding.saveButton", undefined, "Save client branding")}
        </Button>
      </div>
    </form>
  );
}

function ColorField({ label, name, value, onChange }: { label: string; name: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-[var(--p-text-2)]">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded border border-[var(--p-border)]"
          aria-label={label}
        />
        <input
          type="text"
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          pattern="#[0-9a-fA-F]{6}"
          className="ps-input w-full font-mono"
        />
      </div>
    </div>
  );
}
