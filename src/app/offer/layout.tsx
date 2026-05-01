import type { ReactNode } from "react";

export const metadata = {
  title: "Engagement Letter",
  robots: { index: false, follow: false },
};

export default function OfferLayout({ children }: { children: ReactNode }) {
  return (
    <div data-platform="atlvs" className="min-h-screen bg-[var(--surface-base)] text-[var(--text-primary)]">
      <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
    </div>
  );
}
