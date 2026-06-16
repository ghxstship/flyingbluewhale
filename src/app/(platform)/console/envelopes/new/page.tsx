import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NewEnvelopeForm } from "./NewEnvelopeForm";

export const dynamic = "force-dynamic";

export default async function NewEnvelopePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; targetType?: string; targetId?: string }>;
}) {
  const q = await searchParams;
  let projects: { id: string; name: string }[] = [];
  if (hasSupabase) {
    const session = await requireSession();
    const ps = await listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true });
    projects = ps.map((p) => ({ id: p.id, name: p.name }));
  }
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.envelopes.new.eyebrow", undefined, "Legal")}
        title={t("console.envelopes.new.title", undefined, "New E-Sign Envelope")}
        breadcrumbs={[
          { label: t("console.envelopes.title", undefined, "E-Sign Envelopes"), href: "/console/envelopes" },
          { label: t("console.envelopes.new.title", undefined, "New E-Sign Envelope") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewEnvelopeForm
          projects={projects}
          defaultProjectId={q.projectId}
          defaultTargetType={q.targetType}
          defaultTargetId={q.targetId}
        />
      </div>
    </>
  );
}
