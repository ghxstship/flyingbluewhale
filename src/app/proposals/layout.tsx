import type { Metadata } from "next";
import "./proposal.css";

// E-03: token-gated confidential documents — never indexable.
export const metadata: Metadata = {
  title: "Proposal",
  robots: { index: false, follow: false },
};

export default function ProposalsLayout({ children }: { children: React.ReactNode }) {
  return <div className="proposal-surface">{children}</div>;
}
