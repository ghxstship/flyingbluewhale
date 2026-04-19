import type { Metadata } from "next";
import { AppearanceGallery } from "@/app/theme/AppearanceGallery";
import { DensityToggle } from "@/components/ui/DensityToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: "Appearance",
  description: "Pick a visual theme, color mode, and density for your workspace.",
};

export default function AppearancePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">
        Settings
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Appearance</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Eight curated looks. Applies instantly across every page.
      </p>

      <div className="mt-8">
        <AppearanceGallery />
      </div>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="surface p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Color mode
          </div>
          <div className="mt-3">
            <ThemeToggle />
          </div>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Light, dark, or follow your OS setting.
          </p>
        </div>

        <div className="surface p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Density
          </div>
          <div className="mt-3">
            <DensityToggle />
          </div>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Tightens tables, forms, and the sidebar for power users — or loosens them for tablet + accessibility.
          </p>
        </div>
      </section>
    </div>
  );
}
