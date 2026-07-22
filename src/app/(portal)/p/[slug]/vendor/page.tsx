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

export default async function VendorHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();

  // Live per-tile counts — head-only versions of the leaf-page queries.
  const [{ count: submissions }, { count: purchaseOrders }, { count: changesRequested }] = await Promise.all([
    supabase
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("submitted_by", session.userId)
      .is("deleted_at", null),
    supabase
      .from("purchase_orders")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    supabase
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("submitted_by", session.userId)
      .eq("fulfillment_state", "revision_requested")
      .is("deleted_at", null),
  ]);

  const attention: Array<{ href: string; label: string }> = [];
  if ((changesRequested ?? 0) > 0) {
    attention.push({
      href: `/p/${slug}/vendor/submissions`,
      label: t(
        "p.vendor.home.attention.revisions",
        { count: changesRequested ?? 0 },
        `${changesRequested} submission${(changesRequested ?? 0) === 1 ? "" : "s"} with changes requested`,
      ),
    });
  }

  const tiles: Array<{ href: string; label: string; desc: string; count?: number | null }> = [
    {
      href: `/p/${slug}/vendor/submissions`,
      label: t("p.vendor.home.submissions.label", undefined, "Submissions"),
      desc: t("p.vendor.home.submissions.desc", undefined, "Quotes and vendor packages"),
      count: submissions,
    },
    {
      href: `/p/${slug}/vendor/equipment-pull-list`,
      label: t("p.vendor.home.equipmentPullList.label", undefined, "Equipment Pull List"),
      desc: t("p.vendor.home.equipmentPullList.desc", undefined, "Gear assignment"),
    },
    {
      href: `/p/${slug}/vendor/purchase-orders`,
      label: t("p.vendor.home.purchaseOrders.label", undefined, "Purchase Orders"),
      desc: t("p.vendor.home.purchaseOrders.desc", undefined, "POs issued to you"),
      count: purchaseOrders,
    },
    {
      href: `/p/${slug}/vendor/invoices`,
      label: t("p.vendor.home.invoices.label", undefined, "Invoices"),
      desc: t("p.vendor.home.invoices.desc", undefined, "Submit invoice, track status"),
    },
    {
      href: `/p/${slug}/vendor/credentials`,
      label: t("p.vendor.home.credentials.label", undefined, "Credentials"),
      desc: t("p.vendor.home.credentials.desc", undefined, "Upload COI, W-9, licenses"),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "vendor")} />
      <div className="min-w-0 flex-1">
        <ModuleHeader
          eyebrow={project.name}
          title={t("p.vendor.home.title", undefined, "Vendor Portal")}
          subtitle={t("p.vendor.home.subtitle", undefined, "Quotes, POs, invoicing, credentials")}
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
            {tiles.map((item) => (
              <Link key={item.href} href={item.href} className="surface hover-lift p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">{item.label}</div>
                  {item.count != null && <Badge variant="muted">{item.count}</Badge>}
                </div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
