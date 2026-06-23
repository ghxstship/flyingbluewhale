import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

const SECTIONS = [
  {
    href: "/studio/ai/automations",
    titleKey: "console.ai.sections.automations.title",
    titleFallback: "Automations",
    bodyKey: "console.ai.sections.automations.body",
    bodyFallback:
      "Domain-event triggers, scheduled jobs, webhook fan-out. The runtime dispatcher for everything reactive in the platform.",
  },
  {
    href: "/studio/ai/corpus",
    titleKey: "console.ai.sections.corpus.title",
    titleFallback: "RAG Corpus",
    bodyKey: "console.ai.sections.corpus.body",
    bodyFallback:
      "Index health for the assistant's retrieval corpus. See chunks by source and reindex deliverables, submittals, and RFIs on demand.",
  },
];

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.ai.eyebrow", undefined, "AI")}
        title={t("console.ai.title", undefined, "AI")}
        subtitle={t("console.ai.subtitle", undefined, "Automations and assistive workflows.")}
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
