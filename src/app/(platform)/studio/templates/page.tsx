import Link from "next/link";
import { listProjectTemplates } from "@/lib/db/templates";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ProjectTemplate } from "@/lib/templates/types";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Project Templates Gallery — Phase 6.3 of the SmartSuite parity roadmap.
 */

export const dynamic = "force-dynamic";

export default async function TemplatesGalleryPage() {
  const { t } = await getRequestT();

  const CATEGORY_LABEL: Record<string, string> = {
    festival: t("console.templates.category.festival", undefined, "Festival"),
    activation: t("console.templates.category.activation", undefined, "Activation"),
    tour: t("console.templates.category.tour", undefined, "Tour"),
    corporate: t("console.templates.category.corporate", undefined, "Corporate"),
    sponsor: t("console.templates.category.sponsor", undefined, "Sponsor"),
    custom: t("console.templates.category.custom", undefined, "Custom"),
  };

  let templates: ProjectTemplate[];
  try {
    templates = await listProjectTemplates();
  } catch {
    templates = [];
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="border-ink mb-8 border-b-3 pb-6">
        <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
          {t("console.templates.eyebrow", undefined, "Templates")}
        </div>
        <h1 className="mt-2">{t("console.templates.title", undefined, "PROJECT TEMPLATES")}</h1>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">
          {t(
            "console.templates.description",
            undefined,
            "Start a new project from a curated blueprint. Templates seed deliverables, tasks, and module enablement. One click to a working project.",
          )}
        </p>
      </header>

      {templates.length === 0 ? (
        <EmptyState
          title={t("console.templates.empty.title", undefined, "No templates yet")}
          description={t(
            "console.templates.empty.description",
            undefined,
            "The official template gallery loads from the platform. If this is empty, the migration may not have applied.",
          )}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Link
              key={tpl.id}
              href={`/studio/templates/${tpl.id}/new`}
              className="hover-lift block"
              aria-label={t("console.templates.useTemplateAria", { name: tpl.name }, `Use template ${tpl.name}`)}
            >
              <Card>
                <CardHeader
                  title={tpl.name}
                  subtitle={tpl.tagline ?? undefined}
                  action={
                    tpl.isOfficial ? (
                      <Badge variant="info">{t("console.templates.officialBadge", undefined, "Official")}</Badge>
                    ) : undefined
                  }
                />
                <CardBody>
                  <Badge variant="muted">{CATEGORY_LABEL[tpl.category] ?? tpl.category}</Badge>
                  {tpl.description ? <p className="mt-3 text-sm text-[var(--p-text-2)]">{tpl.description}</p> : null}
                  {tpl.blueprint.project.modules.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tpl.blueprint.project.modules.slice(0, 6).map((m: string) => (
                        <span
                          key={m}
                          className="border-ink rounded border px-1.5 py-0.5 text-[11px] tracking-wider uppercase"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
