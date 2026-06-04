import { notFound, redirect } from "next/navigation";
import { getProjectTemplate } from "@/lib/db/templates";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getRequestT } from "@/lib/i18n/request";
import { applyTemplateAction } from "./actions";

/**
 * Apply Template — Phase 6.3 of the SmartSuite parity roadmap.
 *
 * Capture project name + slug, then materialize the template blueprint
 * into a real project + child rows.
 */

export const dynamic = "force-dynamic";

export default async function ApplyTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const tpl = await getProjectTemplate({ id: templateId });
  if (!tpl) notFound();
  const { t } = await getRequestT();

  async function action(formData: FormData) {
    "use server";
    const result = await applyTemplateAction(templateId, formData);
    if (result?.error) {
      // Server actions can't easily return a render — redirect with the error.
      redirect(`/console/templates/${templateId}/new?error=${encodeURIComponent(result.error)}`);
    }
    if (result && "projectId" in result && result.projectId) {
      redirect(`/console/projects/${result.projectId}`);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <header className="border-ink mb-6 border-b-3 pb-4">
        <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">
          {t("console.templates.new.eyebrow", undefined, "New Project from Template")}
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight uppercase">{tpl.name}</h1>
        {tpl.tagline ? <p className="mt-1 text-xs text-[var(--text-secondary)] italic">{tpl.tagline}</p> : null}
      </header>

      <Card>
        <CardHeader title={t("console.templates.new.cardTitle", undefined, "Project Details")} />
        <CardBody>
          <form action={action} className="space-y-4">
            <Input
              label={t("console.templates.new.projectNameLabel", undefined, "Project Name")}
              name="name"
              required
              placeholder="MMW26 Hialeah"
              maxLength={120}
            />
            <Input
              label={t("console.templates.new.slugLabel", undefined, "Slug")}
              name="slug"
              required
              placeholder="mmw26-hialeah"
              hint={t(
                "console.templates.new.slugHint",
                undefined,
                "Used in URLs. Lowercase letters, numbers, and dashes only.",
              )}
              pattern="[a-z0-9-]+"
              maxLength={64}
            />

            {tpl.blueprint.project.modules.length ? (
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  {t("console.templates.new.modulesLabel", undefined, "Modules to enable")}
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {tpl.blueprint.project.modules.map((m) => (
                    <Badge key={m} variant="muted">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {tpl.blueprint.deliverables?.length ? (
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  {t("console.templates.new.willBeCreatedLabel", undefined, "Will be created")}
                </label>
                <ul className="mt-1.5 list-disc ps-5 text-sm text-[var(--text-secondary)]">
                  {tpl.blueprint.deliverables.map((d, i) => (
                    <li key={i}>
                      <span className="font-mono text-[10px] tracking-wider uppercase">{d.kind}</span>
                      {" — "}
                      {d.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <Button type="submit">
                {t("console.templates.new.createProjectButton", undefined, "Create Project")}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
