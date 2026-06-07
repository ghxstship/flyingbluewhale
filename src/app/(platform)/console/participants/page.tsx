import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page() {
  const { t } = await getRequestT();
  const SECTIONS = [
    {
      href: "/console/participants/delegations",
      title: t("console.participants.delegations.title", undefined, "Delegations"),
      body: t(
        "console.participants.delegations.body",
        undefined,
        "Country / org delegations — head of mission, registered party, accreditations.",
      ),
    },
    {
      href: "/console/participants/entries",
      title: t("console.participants.entries.title", undefined, "Entries"),
      body: t(
        "console.participants.entries.body",
        undefined,
        "Athlete / competitor entries by event, with category + bib management.",
      ),
    },
    {
      href: "/console/participants/visa",
      title: t("console.participants.visa.title", undefined, "Visa"),
      body: t(
        "console.participants.visa.body",
        undefined,
        "Visa workflow — invitation letters, application status, embassy correspondence.",
      ),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.participants.eyebrow", undefined, "Operations")}
        title={t("console.participants.title", undefined, "Participants")}
        subtitle={t(
          "console.participants.subtitle",
          undefined,
          "Delegation registration, athlete entries, visa workflow.",
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
