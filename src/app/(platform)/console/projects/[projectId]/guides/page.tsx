import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { getProject } from "@/lib/db/projects";
import { listGuides, PERSONA_TIERS } from "@/lib/db/guides";
import { hasSupabase } from "@/lib/env";
import type { GuidePersona } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const ALL_PERSONAS: GuidePersona[] = ["staff", "crew", "vendor", "artist", "client", "sponsor", "guest", "custom"];

export default async function GuidesIndex({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!hasSupabase) notFound();
  const session = await requireSession();
  const project = await getProject(session.orgId, projectId);
  if (!project) notFound();
  const guides = await listGuides(session.orgId, projectId);

  const byPersona = new Map(guides.map((g) => [g.persona, g]));

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title="Event guides"
        subtitle="Per-role Know-Before-You-Go — authored here, served in portals + mobile"
      />
      <div className="page-content space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ALL_PERSONAS.map((p) => {
            const existing = byPersona.get(p);
            const tierInfo = PERSONA_TIERS[p];
            return (
              <Link
                key={p}
                href={`/console/projects/${projectId}/guides/${p}`}
                className="surface hover-lift p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold capitalize">{p}</div>
                  {existing?.published ? <Badge variant="success">Live</Badge> : existing ? <Badge variant="muted">Draft</Badge> : <Badge variant="muted">None</Badge>}
                </div>
                <div className="mt-2 text-xs text-[var(--text-muted)]">Tier {tierInfo.tier} · {tierInfo.classification}</div>
                {existing?.title && <div className="mt-2 text-sm">{existing.title}</div>}
              </Link>
            );
          })}
        </div>
        <div className="surface-inset p-5 text-sm text-[var(--text-muted)]">
          <div className="text-sm font-semibold text-[var(--foreground)]">Boarding-Pass integration</div>
          <p className="mt-2">
            Guides follow the Boarding Pass Know-Before-You-Go pattern: same static schema, different data per role.
            Author the config once per persona, publish, and the same rendering ships to the external portal (<code className="font-mono">/p/[slug]/guide</code>)
            and the mobile PWA (<code className="font-mono">/m/guide</code>) — automatically scoped to the viewer&apos;s role.
          </p>
          <div className="mt-3">
            <Button href={`/console/projects/${projectId}/guides/custom`} variant="secondary">Start custom guide</Button>
          </div>
        </div>
      </div>
    </>
  );
}
