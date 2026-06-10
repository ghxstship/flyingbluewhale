import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  const SECTIONS = [
    {
      href: "/console/commercial/sponsors",
      title: t("console.commercial.sections.sponsors.title", undefined, "Sponsors"),
      body: t(
        "console.commercial.sections.sponsors.body",
        undefined,
        "Sponsor entitlements, activations, brand assets, reporting, impressions.",
      ),
    },
    {
      href: "/console/commercial/hospitality",
      title: t("console.commercial.sections.hospitality.title", undefined, "Hospitality"),
      body: t(
        "console.commercial.sections.hospitality.body",
        undefined,
        "VIP package management, allocations, fulfillment.",
      ),
    },
    // Ticketing card removed: /console/commercial/tickets never existed —
    // ticketing lives in unified assignments (catalog kind "ticket").
    {
      href: "/console/commercial/licensing",
      title: t("console.commercial.sections.licensing.title", undefined, "Licensing"),
      body: t(
        "console.commercial.sections.licensing.body",
        undefined,
        "Music sync, broadcast rights, performance licenses.",
      ),
    },
    {
      href: "/console/settings/branding",
      title: t("console.commercial.sections.brand.title", undefined, "Brand"),
      body: t("console.commercial.sections.brand.body", undefined, "Logo, colors, custom domain, white-label posture."),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.commercial.eyebrow", undefined, "Commercial")}
        title={t("console.commercial.title", undefined, "Commercial")}
        subtitle={t(
          "console.commercial.subtitle",
          undefined,
          "Revenue surfaces — sponsors, ticketing, hospitality, licensing, brand.",
        )}
      />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{s.title}</div>
              <p className="mt-2 text-xs text-[var(--p-text-2)]">{s.body}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent)]">
                {t("common.open", undefined, "Open")} <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
