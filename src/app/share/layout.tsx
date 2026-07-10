import type { Metadata } from "next";
import type { ReactNode } from "react";

// E-03: token-gated record shares — never indexable. Metadata only; the page
// itself is owned by the share-surface rebuild.
export const metadata: Metadata = {
  title: "Shared Record",
  robots: { index: false, follow: false },
};

export default function ShareLayout({ children }: { children: ReactNode }) {
  return children;
}
