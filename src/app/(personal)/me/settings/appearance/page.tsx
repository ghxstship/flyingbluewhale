import type { Metadata } from "next";
import { DensityToggle } from "@/components/ui/DensityToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getRequestT } from "@/lib/i18n/request";

export const metadata: Metadata = {
  title: "Appearance",
  description: "Pick a color mode and density for your workspace.",
};

export default async function AppearancePage() {
  const { t } = await getRequestT();
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="eyebrow eyebrow-accent">
        {t("me.appearance.eyebrow", undefined, "Settings")}
      </div>
      <h1 className="mt-3">
        {t("me.appearance.title", undefined, "Appearance")}
      </h1>
      <p className="mt-3 text-sm text-[var(--p-text-2)]">
        {t(
          "me.appearance.intro",
          undefined,
          "The ATLVS product kit themes every app surface. Mode and density are yours to tune.",
        )}
      </p>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="surface p-5">
          <div className="eyebrow">
            {t("me.appearance.colorMode.label", undefined, "Color mode")}
          </div>
          <div className="mt-3">
            <ThemeToggle />
          </div>
          <p className="mt-3 text-xs text-[var(--p-text-2)]">
            {t("me.appearance.colorMode.hint", undefined, "Light, dark, or follow your OS setting.")}
          </p>
        </div>

        <div className="surface p-5">
          <div className="eyebrow">
            {t("me.appearance.density.label", undefined, "Density")}
          </div>
          <div className="mt-3">
            <DensityToggle />
          </div>
          <p className="mt-3 text-xs text-[var(--p-text-2)]">
            {t(
              "me.appearance.density.hint",
              undefined,
              "Tightens tables, forms, and the sidebar for power users — or loosens them for tablet + accessibility.",
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
