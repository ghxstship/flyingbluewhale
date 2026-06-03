import type { Metadata } from "next";
import { DensityToggle } from "@/components/ui/DensityToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: "Appearance",
  description: "Pick a color mode and density for your workspace.",
};

export default function AppearancePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">Settings</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Appearance</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        The platform ships a two-skin canon — the ATLVS product kit on every app surface and the cosmic GHXSTSHIP kit on
        the parent-company marketing page. Mode and density are yours to tune.
      </p>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="surface p-5">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Color mode
          </div>
          <div className="mt-3">
            <ThemeToggle />
          </div>
          <p className="mt-3 text-xs text-[var(--text-muted)]">Light, dark, or follow your OS setting.</p>
        </div>

        <div className="surface p-5">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">Density</div>
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
