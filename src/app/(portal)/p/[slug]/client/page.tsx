import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function ClientHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();

  // Live per-tile counts — the same project-scoped reads the leaf pages run,
  // reduced to head-only counts.
  const [{ count: proposals }, { count: deliverables }, { count: openInvoices }, { data: proposalRows }] =
    await Promise.all([
      supabase
        .from("proposals")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("project_id", project.id),
      supabase
        .from("deliverables")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .eq("project_id", project.id)
        .is("deleted_at", null),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .eq("project_id", project.id)
        .is("deleted_at", null)
        .in("invoice_state", ["sent", "overdue"]),
      supabase.from("proposals").select("id").is("deleted_at", null).eq("project_id", project.id).limit(200),
    ]);
  const proposalIds = ((proposalRows ?? []) as Array<{ id: string }>).map((p) => p.id);
  const { count: pendingApprovals } = proposalIds.length
    ? await supabase
        .from("proposal_approvals")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .in("proposal_id", proposalIds)
        .eq("state", "pending")
    : { count: 0 };

  const attention: Array<{ href: string; label: string }> = [];
  if ((pendingApprovals ?? 0) > 0) {
    attention.push({
      href: `/p/${slug}/client/proposals`,
      label: t(
        "p.client.home.attention.approvals",
        { count: pendingApprovals ?? 0 },
        `${pendingApprovals} approval${(pendingApprovals ?? 0) === 1 ? "" : "s"} waiting on you`,
      ),
    });
  }
  if ((openInvoices ?? 0) > 0) {
    attention.push({
      href: `/p/${slug}/client/invoices`,
      label: t(
        "p.client.home.attention.invoices",
        { count: openInvoices ?? 0 },
        `${openInvoices} open invoice${(openInvoices ?? 0) === 1 ? "" : "s"}`,
      ),
    });
  }

  const tiles: Array<{ href: string; label: string; desc: string; count?: number | null }> = [
    {
      href: `/p/${slug}/client/proposals`,
      label: t("p.client.home.tiles.proposals.label", undefined, "Proposals"),
      desc: t("p.client.home.tiles.proposals.desc", undefined, "Review · approve · e-sign"),
      count: proposals,
    },
    {
      href: `/p/${slug}/client/deliverables`,
      label: t("p.client.home.tiles.deliverables.label", undefined, "Deliverables"),
      desc: t("p.client.home.tiles.deliverables.desc", undefined, "Documents and assets"),
      count: deliverables,
    },
    {
      href: `/p/${slug}/client/invoices`,
      label: t("p.client.home.tiles.invoices.label", undefined, "Invoices"),
      desc: t("p.client.home.tiles.invoices.desc", undefined, "Pay invoices, download receipts"),
      count: openInvoices,
    },
    {
      href: `/p/${slug}/client/messages`,
      label: t("p.client.home.tiles.messages.label", undefined, "Messages"),
      desc: t("p.client.home.tiles.messages.desc", undefined, "Direct thread with your team"),
    },
    {
      href: `/p/${slug}/client/files`,
      label: t("p.client.home.tiles.files.label", undefined, "Files"),
      desc: t("p.client.home.tiles.files.desc", undefined, "Shared documents and assets"),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "client")} />
      <div className="min-w-0 flex-1">
        <ModuleHeader
          eyebrow={project.name}
          title={t("p.client.home.title", undefined, "Client Portal")}
          subtitle={t("p.client.home.subtitle", undefined, "Proposals, deliverables, invoices, and files")}
        />
        <div className="page-content space-y-4">
          {attention.length > 0 && (
            <div className="surface-inset rounded-[var(--p-r-md)] p-4">
              <div className="eyebrow">
                {t("p.shared.home.attention", undefined, "Needs your attention")}
              </div>
              <ul className="mt-2 space-y-1">
                {attention.map((a) => (
                  <li key={a.href + a.label}>
                    <Link href={a.href} className="text-sm font-medium text-[var(--p-accent-text)] underline">
                      {a.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((tile) => (
              <Link key={tile.href} href={tile.href} className="surface hover-lift p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">{tile.label}</div>
                  {tile.count != null && <Badge variant="muted">{tile.count}</Badge>}
                </div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{tile.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
