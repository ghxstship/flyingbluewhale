import type { Metadata } from "next";
import type { ReactNode } from "react";

// E-24: mirror the offer shell so the toolbar and document share one measure.
// E-03: token-gated confidential agreement — never indexable.
export const metadata: Metadata = {
  title: "Master Services Agreement",
  robots: { index: false, follow: false },
};

export default function MsaLayout({ children }: { children: ReactNode }) {
  return (
    <div data-ui="saas" data-platform="atlvs" className="min-h-screen bg-[var(--p-bg)] text-[var(--p-text-1)]">
      <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
    </div>
  );
}
