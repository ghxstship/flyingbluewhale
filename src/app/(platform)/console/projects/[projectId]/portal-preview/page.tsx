export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";

const PERSONAS: Array<{ slug: "guest" | "artist" | "vendor" | "client" | "sponsor" | "crew"; label: string }> = [
  { slug: "guest", label: "Guest" },
  { slug: "artist", label: "Artist" },
  { slug: "vendor", label: "Vendor" },
  { slug: "client", label: "Client" },
  { slug: "sponsor", label: "Sponsor" },
  { slug: "crew", label: "Crew" },
];

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects").select("id, name, slug").eq("org_id", session.orgId).eq("id", projectId).maybeSingle();
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title="Portal preview"
        subtitle="Jump into each persona's portal view for this project."
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Portal preview" },
        ]}
      />
      <div className="page-content max-w-4xl">
        {!project ? null : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {PERSONAS.map((p) => (
              <li key={p.slug}>
                <Link href={`/p/${project.slug}/${p.slug}`} className="surface hover-lift flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-semibold">{p.label} portal</div>
                    <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">/p/{project.slug}/{p.slug}</div>
                  </div>
                  <Badge variant="muted">Preview</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
