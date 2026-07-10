import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

type Section = {
  href: string;
  titleKey: string;
  titleFallback: string;
  bodyKey: string;
  bodyFallback: string;
};

const SECTIONS: Section[] = [
  {
    href: "/studio/legal/ip",
    titleKey: "console.legal.sections.ip.title",
    titleFallback: "Intellectual Property",
    bodyKey: "console.legal.sections.ip.body",
    bodyFallback: "Trademark, copyright, music sync, image releases.",
  },
  {
    href: "/studio/legal/privacy",
    titleKey: "console.legal.sections.privacy.title",
    titleFallback: "Privacy",
    bodyKey: "console.legal.sections.privacy.body",
    bodyFallback: "Privacy policy register, breach response, data inventories.",
  },
  {
    href: "/studio/legal/privacy/dsar",
    titleKey: "console.legal.sections.dsar.title",
    titleFallback: "DSAR Requests",
    bodyKey: "console.legal.sections.dsar.body",
    bodyFallback: "Data subject access requests: intake, fulfillment, audit trail.",
  },
  {
    href: "/studio/legal/privacy/consent",
    titleKey: "console.legal.sections.consent.title",
    titleFallback: "Consent",
    bodyKey: "console.legal.sections.consent.body",
    bodyFallback: "Consent receipts, withdrawal, version history.",
  },
  {
    href: "/studio/legal/privacy/datamap",
    titleKey: "console.legal.sections.datamap.title",
    titleFallback: "Data Map",
    bodyKey: "console.legal.sections.datamap.body",
    bodyFallback: "What data we hold, where, who can see it, how long it's retained.",
  },
  {
    href: "/studio/legal/insurance",
    titleKey: "console.legal.sections.insurance.title",
    titleFallback: "Insurance",
    bodyKey: "console.legal.sections.insurance.body",
    bodyFallback: "GL, workers' comp, event cancellation, COIs.",
  },
];

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.eyebrow", undefined, "Legal")}
        title={t("console.legal.title", undefined, "Legal")}
        subtitle={t("console.legal.subtitle", undefined, "IP, privacy, DSAR, consent, data map, insurance.")}
      />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{t(s.titleKey, undefined, s.titleFallback)}</div>
              <p className="mt-2 text-xs text-[var(--p-text-2)]">{t(s.bodyKey, undefined, s.bodyFallback)}</p>
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
