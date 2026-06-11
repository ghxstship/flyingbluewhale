export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { getRequestT } from "@/lib/i18n/request";
import { urlFor } from "@/lib/urls";

const PERSONAS: Array<{
  slug: "guest" | "artist" | "vendor" | "client" | "sponsor" | "crew";
  labelKey: string;
  labelFallback: string;
}> = [
  { slug: "guest", labelKey: "console.projects.portalPreview.persona.guest", labelFallback: "Guest" },
  { slug: "artist", labelKey: "console.projects.portalPreview.persona.artist", labelFallback: "Artist" },
  { slug: "vendor", labelKey: "console.projects.portalPreview.persona.vendor", labelFallback: "Vendor" },
  { slug: "client", labelKey: "console.projects.portalPreview.persona.client", labelFallback: "Client" },
  { slug: "sponsor", labelKey: "console.projects.portalPreview.persona.sponsor", labelFallback: "Sponsor" },
  { slug: "crew", labelKey: "console.projects.portalPreview.persona.crew", labelFallback: "Crew" },
];

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("org_id", session.orgId)
    .eq("id", projectId)
    .maybeSingle();
  const projectFallback = t("console.projects.portalPreview.projectFallback", undefined, "Project");
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? projectFallback}
        title={t("console.projects.portalPreview.title", undefined, "Portal Preview")}
        subtitle={t(
          "console.projects.portalPreview.subtitle",
          undefined,
          "Each Persona's Portal View For This Project",
        )}
        breadcrumbs={[
          { label: t("console.projects.breadcrumb", undefined, "Projects"), href: "/console/projects" },
          { label: project?.name ?? projectFallback, href: `/console/projects/${projectId}` },
          { label: t("console.projects.portalPreview.title", undefined, "Portal Preview") },
        ]}
      />
      <div className="page-content max-w-4xl">
        {!project ? null : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {PERSONAS.map((p) => {
              const personaLabel = t(p.labelKey, undefined, p.labelFallback);
              return (
                <li key={p.slug}>
                  <Link
                    href={urlFor("portal", `/${project.slug}/${p.slug}`)}
                    className="surface hover-lift flex items-center justify-between p-4"
                  >
                    <div>
                      <div className="text-sm font-semibold">
                        {t(
                          "console.projects.portalPreview.personaPortal",
                          { persona: personaLabel },
                          `${personaLabel} portal`,
                        )}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-[var(--p-text-2)]">
                        /p/{project.slug}/{p.slug}
                      </div>
                    </div>
                    <Badge variant="muted">
                      {t("console.projects.portalPreview.previewBadge", undefined, "Preview")}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
