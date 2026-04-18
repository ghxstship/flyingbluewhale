"use client";

import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { brandingToCssVars, type Branding } from "@/lib/branding";
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
  const [accent, setAccent] = useState(initial.accentColor ?? "#DC2626");
  const [accentFg, setAccentFg] = useState(initial.accentForeground ?? "#FFFFFF");
  const [logo, setLogo] = useState(initial.logoUrl ?? "");
  const [favicon, setFavicon] = useState(initial.faviconUrl ?? "");
  const [hero, setHero] = useState(initial.heroImageUrl ?? "");
  const [og, setOg] = useState(initial.ogImageUrl ?? "");

  const previewStyle = brandingToCssVars({
    accentColor: accent,
    accentForeground: accentFg,
  }) as React.CSSProperties;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FormShell action={saveBrandingAction} submitLabel="Save branding" dirtyGuard>
        <input type="hidden" name="projectId" value={projectId} />
        <Input
          label="Accent color"
          name="accentColor"
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
          hint="Hex like #DC2626 — overrides --org-primary in portals."
          placeholder="#DC2626"
        />
        <Input
          label="Accent foreground"
          name="accentForeground"
          value={accentFg}
          onChange={(e) => setAccentFg(e.target.value)}
          hint="Text color shown on top of the accent."
          placeholder="#FFFFFF"
        />
        <Input
          label="Logo URL"
          name="logoUrl"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          hint="Must be https. SVG or PNG with transparent bg recommended."
          placeholder="https://…"
        />
        <Input
          label="Favicon URL"
          name="faviconUrl"
          value={favicon}
          onChange={(e) => setFavicon(e.target.value)}
          hint="https URL to a square 512×512 PNG."
          placeholder="https://…"
        />
        <Input
          label="Hero image URL"
          name="heroImageUrl"
          value={hero}
          onChange={(e) => setHero(e.target.value)}
          hint="Used on the portal landing for this project."
          placeholder="https://…"
        />
        <Input
          label="OG image URL"
          name="ogImageUrl"
          value={og}
          onChange={(e) => setOg(e.target.value)}
          hint="Open Graph share image (1200×630)."
          placeholder="https://…"
        />
      </FormShell>

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Live preview
        </div>
        <div
          className="surface-raised overflow-hidden"
          style={previewStyle}
          data-platform="gvteway"
        >
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
                Primary action
              </button>
              <button
                type="button"
                className="rounded border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium"
              >
                Secondary
              </button>
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Inputs are sanitized — only #hex colors and https URLs are accepted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
