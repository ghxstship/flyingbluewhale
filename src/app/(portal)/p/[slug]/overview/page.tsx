import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";

export const dynamic = "force-dynamic";

export default async function PortalOverview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  return (
    <>
      <ModuleHeader eyebrow={project.name} title="Project overview" subtitle="Pick your portal to continue" />
      <div className="page-content">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["artist", "vendor", "client", "sponsor", "guest", "crew"].map((p) => (
            <Link key={p} href={`/p/${slug}/${p}`} className="surface hover-lift p-5">
              <div className="text-sm font-semibold capitalize">{p}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">Open {p} portal →</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
