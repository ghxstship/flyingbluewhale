import type { Metadata } from "next";
import type { ReactNode } from "react";

// E-03: token-gated confidential documents — never indexable.
export const metadata: Metadata = {
  title: "Sign Document",
  robots: { index: false, follow: false },
};

export default function SignLayout({ children }: { children: ReactNode }) {
  return children;
}
