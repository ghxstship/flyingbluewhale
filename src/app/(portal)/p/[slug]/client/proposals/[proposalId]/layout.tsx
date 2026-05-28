import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { resolveProposalContext } from "@/lib/proposals/portal/queries";

const SUBNAV: { href: string; label: string }[] = [
  { href: "", label: "Overview" },
  { href: "/lifecycle", label: "Lifecycle" },
  { href: "/change-orders", label: "Change Orders" },
  { href: "/revisions", label: "Revisions" },
  { href: "/approvals", label: "Approvals" },
  { href: "/files", label: "Files" },
  { href: "/activity", label: "Activity" },
];

export default async function ProposalPortalLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string; proposalId: string }>;
  children: ReactNode;
}) {
  if (!hasSupabase) notFound();
  const { slug, proposalId } = await params;
  const ctx = await resolveProposalContext(slug, proposalId);
  if (!ctx) notFound();

  const base = `/p/${slug}/client/proposals/${proposalId}`;

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "client")} />
      <div className="flex-1">
        <ModuleHeader
          eyebrow={ctx.project.name}
          title={ctx.proposal.title}
          subtitle={`Status: ${ctx.proposal.status}`}
        />
        <div className="px-6 pt-2">
          <nav className="flex flex-wrap gap-1 border-b border-[var(--border-color)]">
            {SUBNAV.map((item) => (
              <Link
                key={item.href}
                href={`${base}${item.href}`}
                className="nav-item rounded-t px-3 py-2 text-sm hover:bg-[var(--surface-inset)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={`/p/${slug}/client/proposals`}
              className="nav-item ms-auto rounded-t px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-inset)]"
            >
              ← All proposals
            </Link>
          </nav>
        </div>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
