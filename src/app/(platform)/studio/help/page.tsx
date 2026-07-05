import Link from "next/link";
import { BookOpen, Keyboard, Sparkles, Activity, LifeBuoy, FileText } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Help hub (kit 21 W6) — the console's own product-help landing, distinct
 * from the workspace Knowledge Base (the org's SOPs). Section cards deep-link
 * to the real surfaces: the KB, keyboard shortcuts (the `?` overlay), What's
 * New, and System Status.
 */
export default async function HelpHubPage() {
  const { t } = await getRequestT();

  const cards = [
    {
      href: "/studio/knowledge",
      Icon: BookOpen,
      title: t("console.help.hub.kb.title", undefined, "Knowledge Base"),
      body: t("console.help.hub.kb.body", undefined, "Your workspace's SOPs, playbooks, and how-tos."),
    },
    {
      href: "/studio/help/whats-new",
      Icon: Sparkles,
      title: t("console.help.whatsNew.title", undefined, "What's New"),
      body: t("console.help.hub.whatsNew.body", undefined, "Every release — features, improvements, and fixes."),
    },
    {
      href: "/studio/help/status",
      Icon: Activity,
      title: t("console.help.status.title", undefined, "System Status"),
      body: t("console.help.hub.status.body", undefined, "Live health for every platform component."),
    },
    {
      href: "/studio/services/requests/new",
      Icon: LifeBuoy,
      title: t("console.help.hub.contact.title", undefined, "Contact Support"),
      body: t("console.help.hub.contact.body", undefined, "Open a request — pick a severity, we'll respond on SLA."),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.help.eyebrow", undefined, "Support")}
        title={t("console.help.hub.title", undefined, "Help")}
        info={t("console.help.hub.info", undefined, "Product help, release notes, and platform status.")}
      />
      <div className="page-content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map(({ href, Icon, title, body }) => (
            <Link key={href} href={href} className="surface hover-lift flex items-start gap-3 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--p-r-md)] bg-[var(--p-accent-weak,var(--p-surface))] text-[var(--p-accent-text)]">
                <Icon size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[var(--p-text-1)]">{title}</div>
                <p className="mt-0.5 text-xs text-[var(--p-text-2)]">{body}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--p-text-3)]">
          <Keyboard size={14} aria-hidden="true" />
          <FileText size={14} aria-hidden="true" />
          <span>{t("console.help.hub.shortcutsHint", undefined, "Press ? anywhere for keyboard shortcuts.")}</span>
        </div>
      </div>
    </>
  );
}
