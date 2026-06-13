"use client";

import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { brandingToCssVars, type Branding } from "@/lib/branding";
import { LogoUploader } from "@/components/branding/LogoUploader";
import { saveBrandingAction } from "./actions";

export function BrandingForm({
  projectId,
  initial,
  projectName,
}: {
  projectId: string;
  initial: Branding;
  projectName: string;
}) {
  const t = useT();
  const [accent, setAccent] = useState(initial.accentColor ?? "#DC2626");
  const [accentFg, setAccentFg] = useState(initial.accentForeground ?? "#FFFFFF");
  const [secondary, setSecondary] = useState(initial.secondaryColor ?? "#6D4A2A");
  const [logo, setLogo] = useState(initial.logoUrl ?? "");
  const [favicon, setFavicon] = useState(initial.faviconUrl ?? "");
  const [hero, setHero] = useState(initial.heroImageUrl ?? "");
  const [og, setOg] = useState(initial.ogImageUrl ?? "");

  const previewStyle = brandingToCssVars({
    accentColor: accent,
    accentForeground: accentFg,
    secondaryColor: secondary,
  }) as React.CSSProperties;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FormShell
        action={saveBrandingAction}
        submitLabel={t("console.projects.branding.submit", undefined, "Save Branding")}
        dirtyGuard
      >
        <input type="hidden" name="projectId" value={projectId} />
        <Input
          label={t("console.projects.branding.accentColor.label", undefined, "Accent Color")}
          name="accentColor"
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
          hint={t(
            "console.projects.branding.accentColor.hint",
            undefined,
            "Hex like #DC2626 — overrides --p-accent in portals.",
          )}
          placeholder="#DC2626"
        />
        <Input
          label={t("console.projects.branding.accentForeground.label", undefined, "Accent Foreground")}
          name="accentForeground"
          value={accentFg}
          onChange={(e) => setAccentFg(e.target.value)}
          hint={t(
            "console.projects.branding.accentForeground.hint",
            undefined,
            "Text color shown on top of the accent.",
          )}
          placeholder="#FFFFFF"
        />
        <Input
          label={t("console.projects.branding.secondaryColor.label", undefined, "Secondary Color")}
          name="secondaryColor"
          value={secondary}
          onChange={(e) => setSecondary(e.target.value)}
          hint={t(
            "console.projects.branding.secondaryColor.hint",
            undefined,
            "Hex — the joint secondary accent (deck gradients, balance cards).",
          )}
          placeholder="#6D4A2A"
        />
        <LogoUploader
          name="logoUrl"
          scope="project"
          initialUrl={logo}
          onChange={setLogo}
          label={t("console.projects.branding.logoUrl.label", undefined, "Logo")}
        />
        <Input
          label={t("console.projects.branding.faviconUrl.label", undefined, "Favicon URL")}
          name="faviconUrl"
          value={favicon}
          onChange={(e) => setFavicon(e.target.value)}
          hint={t("console.projects.branding.faviconUrl.hint", undefined, "https URL to a square 512×512 PNG.")}
          placeholder="https://…"
        />
        <Input
          label={t("console.projects.branding.heroImageUrl.label", undefined, "Hero Image URL")}
          name="heroImageUrl"
          value={hero}
          onChange={(e) => setHero(e.target.value)}
          hint={t(
            "console.projects.branding.heroImageUrl.hint",
            undefined,
            "Used on the portal landing for this project.",
          )}
          placeholder="https://…"
        />
        <Input
          label={t("console.projects.branding.ogImageUrl.label", undefined, "OG image URL")}
          name="ogImageUrl"
          value={og}
          onChange={(e) => setOg(e.target.value)}
          hint={t("console.projects.branding.ogImageUrl.hint", undefined, "Open Graph share image (1200×630).")}
          placeholder="https://…"
        />
      </FormShell>

      <div className="space-y-3">
        <div className="text-xs font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
          {t("console.projects.branding.livePreview", undefined, "Live preview")}
        </div>
        <div className="surface overflow-hidden" style={previewStyle} data-platform="gvteway">
          {hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="" className="h-32 w-full object-cover" />
          )}
          <div className="p-4">
            <div className="flex items-center gap-2">
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-6 w-auto" />
              )}
              <div className="text-sm font-semibold">{projectName}</div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded px-3 py-1.5 text-xs font-medium"
                style={{ background: accent, color: accentFg }}
              >
                {t("console.projects.branding.preview.primaryAction", undefined, "Primary action")}
              </button>
              <button type="button" className="rounded border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium">
                {t("console.projects.branding.preview.secondary", undefined, "Secondary")}
              </button>
            </div>
            <p className="mt-3 text-xs text-[var(--p-text-2)]">
              {t(
                "console.projects.branding.preview.sanitizedNote",
                undefined,
                "Inputs are sanitized — only #hex colors and https URLs are accepted.",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
