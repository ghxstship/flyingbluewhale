import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function VendorHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  const { t } = await getRequestT();
  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "vendor")} />
      <div className="flex-1">
        <ModuleHeader
          eyebrow={project.name}
          title={t("p.vendor.home.title", undefined, "Vendor Portal")}
          subtitle={t("p.vendor.home.subtitle", undefined, "Quotes, POs, invoicing, credentials")}
        />
        <div className="page-content">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                href: `/p/${slug}/vendor/submissions`,
                label: t("p.vendor.home.submissions.label", undefined, "Submissions"),
                desc: t("p.vendor.home.submissions.desc", undefined, "Quotes and vendor packages"),
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
            ].map((item) => (
              <Link key={item.href} href={item.href} className="surface hover-lift p-5">
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
