import Link from "next/link";
import { listProjectTemplates } from "@/lib/db/templates";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ProjectTemplate } from "@/lib/templates/types";

/**
 * Project Templates Gallery — Phase 6.3 of the SmartSuite parity roadmap.
 */

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  festival: "Festival",
  activation: "Activation",
  tour: "Tour",
  corporate: "Corporate",
  sponsor: "Sponsor",
  custom: "Custom",
};

export default async function TemplatesGalleryPage() {
  let templates: ProjectTemplate[];
  try {
    templates = await listProjectTemplates();
  } catch {
    templates = [];
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="border-ink mb-8 border-b-3 pb-6">
        <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Templates</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">PROJECT TEMPLATES</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Start a new project from a curated blueprint. Templates seed deliverables, tasks, and module enablement — one
          click to a working project.
        </p>
      </header>

      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="The official template gallery loads from the platform. If this is empty, the migration may not have applied."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Link
              key={tpl.id}
              href={`/console/templates/${tpl.id}/new`}
              className="hover-lift block"
              aria-label={`Use template ${tpl.name}`}
            >
              <Card>
                <CardHeader
                  title={tpl.name}
                  subtitle={tpl.tagline ?? undefined}
                  action={tpl.isOfficial ? <Badge variant="info">Official</Badge> : undefined}
                />
                <CardBody>
                  <Badge variant="muted">{CATEGORY_LABEL[tpl.category] ?? tpl.category}</Badge>
                  {tpl.description ? (
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">{tpl.description}</p>
                  ) : null}
                  {tpl.blueprint.project.modules.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tpl.blueprint.project.modules.slice(0, 6).map((m: string) => (
                        <span
                          key={m}
                          className="border-ink rounded border px-1.5 py-0.5 text-[10px] tracking-wider uppercase"
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
