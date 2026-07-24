"use client";

import { useActionState, useState } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useT } from "@/lib/i18n/LocaleProvider";
import { LogoUploader } from "@/components/branding/LogoUploader";
import { BRAND_FALLBACK } from "@/lib/branding";
import { bestInk, contrastRatio, wcagLevel } from "@/lib/theme/contrast-util";
import { updateBrandingAction, type BrandingState } from "./actions";
import { resolveActionError } from "@/lib/errors";

type Initial = {
  productName: string;
  logoUrl: string;
  accentColor: string;
  accentForeground: string;
  secondaryColor: string;
  faviconUrl: string;
  heroImageUrl: string;
  ogImageUrl: string;
};

export function BrandingForm({ initial }: { initial: Initial }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<BrandingState, FormData>(async (prev, fd) => {
    const result = await updateBrandingAction(prev, fd);
    if (result?.ok) toast.success(t("console.settings.branding.savedToast", undefined, "Branding saved"));
    else if (result?.error) toast.error(result.error);
    return result;
  }, null);

  const [accent, setAccent] = useState(initial.accentColor || BRAND_FALLBACK.accent);
  const [foreground, setForeground] = useState(initial.accentForeground || BRAND_FALLBACK.accentFg);
  const [secondary, setSecondary] = useState(initial.secondaryColor || BRAND_FALLBACK.secondary);
  const [productName, setProductName] = useState(initial.productName);

  return (
    <form action={formAction} className="space-y-5">
      <section className="surface p-5">
        <h3 className="text-sm font-semibold">
          {t("console.settings.branding.identity.title", undefined, "Identity")}
        </h3>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "console.settings.branding.identity.description",
            undefined,
            "Override the product name + logo that your crew, clients, and vendors see.",
          )}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            label={t("console.settings.branding.identity.productNameLabel", undefined, "Product Name Override")}
            name="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            maxLength={48}
            placeholder="ATLVS Technologies"
          />
          <LogoUploader
            name="logoUrl"
            scope="org"
            initialUrl={initial.logoUrl}
            label={t("console.settings.branding.identity.logoUrlLabel", undefined, "Logo")}
          />
        </div>
      </section>

      <section className="surface p-5">
        <h3 className="text-sm font-semibold">{t("console.settings.branding.color.title", undefined, "Color")}</h3>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t("console.settings.branding.color.descriptionPrefix", undefined, "Overrides")}{" "}
          <code className="font-mono">--p-accent</code>{" "}
          {t("console.settings.branding.color.descriptionSuffix", undefined, "across every branded surface + PDF.")}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.branding.color.accentLabel", undefined, "Accent Color")}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border border-[var(--p-border)]"
                aria-label={t("console.settings.branding.color.pickAccentAria", undefined, "Pick Accent Color")}
              />
              <input
                type="text"
                name="accentColor"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                pattern="#[0-9a-fA-F]{6}"
                className="ps-input w-full font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.branding.color.foregroundLabel", undefined, "Text on Accent")}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border border-[var(--p-border)]"
                aria-label={t("console.settings.branding.color.pickForegroundAria", undefined, "Pick Foreground Color")}
              />
              <input
                type="text"
                name="accentForeground"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                pattern="#[0-9a-fA-F]{6}"
                className="ps-input w-full font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.branding.color.secondaryLabel", undefined, "Secondary Color")}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border border-[var(--p-border)]"
                aria-label={t("console.settings.branding.color.pickSecondaryAria", undefined, "Pick Secondary Color")}
              />
              <input
                type="text"
                name="secondaryColor"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                pattern="#[0-9a-fA-F]{6}"
                className="ps-input w-full font-mono"
              />
            </div>
          </div>
        </div>
        <WcagGuard accent={accent} foreground={foreground} onUseInk={setForeground} t={t} />
      </section>

      <section className="surface p-5">
        <h3 className="text-sm font-semibold">{t("console.settings.branding.assets.title", undefined, "Assets")}</h3>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "console.settings.branding.assets.description",
            undefined,
            "Hero image + favicon + Open Graph fallback. Used on marketing + shared links.",
          )}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            label={t("console.settings.branding.assets.faviconLabel", undefined, "Favicon URL")}
            name="faviconUrl"
            type="url"
            defaultValue={initial.faviconUrl}
            placeholder="https://.../favicon.ico"
          />
          <Input
            label={t("console.settings.branding.assets.heroLabel", undefined, "Hero Image URL")}
            name="heroImageUrl"
            type="url"
            defaultValue={initial.heroImageUrl}
            placeholder="https://.../hero.jpg"
          />
          <Input
            label={t("console.settings.branding.assets.ogLabel", undefined, "Open Graph image URL")}
            name="ogImageUrl"
            type="url"
            defaultValue={initial.ogImageUrl}
            placeholder="https://.../og.png"
          />
        </div>
      </section>

      <section
        className="surface p-5"
        style={{ ["--p-accent" as string]: accent, ["--p-accent-contrast" as string]: foreground }}
      >
        <h3 className="text-sm font-semibold">{t("console.settings.branding.preview.title", undefined, "Preview")}</h3>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "console.settings.branding.preview.description",
            undefined,
            "Live preview reflects your pending changes; save to apply everywhere.",
          )}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="ps-btn ps-btn--sm" disabled>
            {productName || t("console.settings.branding.preview.primaryActionFallback", undefined, "Primary action")}
          </button>
          <button type="button" className="ps-btn ps-btn--ghost ps-btn--sm" disabled>
            {t("console.settings.branding.preview.ghost", undefined, "Ghost")}
          </button>
          <span className="text-xs" style={{ color: accent }}>
            {t("console.settings.branding.preview.sampleTextPrefix", undefined, "Sample brand text ·")}{" "}
            {productName || "ATLVS Technologies"}
          </span>
        </div>
      </section>

      {state?.error ? <Alert kind="error">{resolveActionError(state.error, t)}</Alert> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending
            ? t("common.saving", undefined, "Saving…")
            : t("console.settings.branding.saveButton", undefined, "Save branding")}
        </Button>
      </div>
    </form>
  );
}

/**
 * Live WCAG guard (ThemeStudio, v7.7): grades the chosen "text on accent" pair
 * against WCAG 1.4.3 as the operator edits, and offers the best-contrast ink
 * when the pair fails AA. Keeps a white-labeled palette accessible by default.
 */
function WcagGuard({
  accent,
  foreground,
  onUseInk,
  t,
}: {
  accent: string;
  foreground: string;
  onUseInk: (ink: string) => void;
  t: ReturnType<typeof useT>;
}) {
  const ratio = contrastRatio(accent, foreground);
  const level = wcagLevel(ratio);
  const passes = level === "AA" || level === "AAA";
  const tone = passes ? "var(--p-success-text)" : "var(--p-danger-text)";
  const ink = bestInk(accent);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3" role="status" aria-live="polite">
      <span className="text-xs text-[var(--p-text-2)]">
        {t("console.settings.branding.color.contrastLabel", undefined, "Text on accent contrast")}
      </span>
      <span
        className="ps-badge"
        style={{ color: tone, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}
      >
        {ratio == null ? "—" : `${ratio.toFixed(2)}:1`} · {level}
      </span>
      {!passes && ink.toLowerCase() !== foreground.toLowerCase() && (
        <button
          type="button"
          className="ps-btn ps-btn--tertiary ps-btn--sm"
          onClick={() => onUseInk(ink)}
        >
          {t("console.settings.branding.color.useSuggestedInk", undefined, "Use accessible ink")} ({ink})
        </button>
      )}
    </div>
  );
}
