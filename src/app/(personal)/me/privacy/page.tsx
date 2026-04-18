import type { Metadata } from "next";
import { PrivacyControls } from "./PrivacyControls";

export const metadata: Metadata = {
  title: "Privacy & data",
  description: "Export your data, manage cookie consent, or delete your account.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">
        Account
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Privacy & data</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Export your data any time. Manage cookie consent. Delete your account with a 30-day grace
        period.
      </p>
      <div className="mt-8">
        <PrivacyControls />
      </div>
    </div>
  );
}
