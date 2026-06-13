"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Per-proposal brand override (the JOINT layer of the co-brand cascade).
 * Emits the existing `theme_primary` / `theme_secondary` field names so the
 * save action and the resolver's theme fallback stay unchanged. Producer +
 * client logos are managed in their own Brand tabs (Settings → Branding and
 * Client → Brand); this panel sets the accent the whole deck themes on.
 */
export function ProposalBrandPanel({
  initialPrimary,
  initialSecondary,
}: {
  initialPrimary: string;
  initialSecondary: string;
}) {
  const t = useT();
  const [primary, setPrimary] = useState(initialPrimary || "#000000");
  const [secondary, setSecondary] = useState(initialSecondary || "#666666");

  return (
    <section className="surface p-5" style={{ ["--p-accent" as string]: primary, ["--p-accent-secondary" as string]: secondary }}>
      <h3 className="text-sm font-semibold">{t("console.proposals.edit.brand.title", undefined, "Proposal brand")}</h3>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t(
          "console.proposals.edit.brand.description",
          undefined,
          "Accent the deck themes on (the joint layer). Producer + client logos are set in Settings → Branding and the client's Brand tab; both appear in the hero lockup.",
        )}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ColorField
          label={t("console.proposals.edit.brand.accentLabel", undefined, "Accent")}
          name="theme_primary"
          value={primary}
          onChange={setPrimary}
        />
        <ColorField
          label={t("console.proposals.edit.brand.secondaryLabel", undefined, "Secondary")}
          name="theme_secondary"
          value={secondary}
          onChange={setSecondary}
        />
      </div>
      <div className="mt-4 rounded border border-[var(--p-border)] p-4">
        <div className="text-[10px] font-semibold tracking-widest text-[var(--p-text-2)] uppercase">
          {t("console.proposals.edit.brand.previewLabel", undefined, "Preview")}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div
            className="h-8 w-24 rounded"
            style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold" style={{ color: primary }}>
            {t("console.proposals.edit.brand.previewText", undefined, "Heading accent")}
          </span>
        </div>
      </div>
    </section>
  );
}

function ColorField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--p-text-2)]">{label}</label>
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
