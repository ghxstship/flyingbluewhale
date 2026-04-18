import type { Metadata } from "next";
import { AppearanceGallery } from "@/app/theme/AppearanceGallery";

export const metadata: Metadata = {
  title: "Appearance",
  description: "Pick a visual theme for your workspace.",
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
    </div>
  );
}
