import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NewWipSnapshotForm } from "./NewWipSnapshotForm";

export const dynamic = "force-dynamic";

export default async function NewWipSnapshotPage() {
  const { t } = await getRequestT();
  let projects: { id: string; name: string }[] = [];
  if (hasSupabase) {
    const session = await requireSession();
    const ps = await listOrgScoped("projects", session.orgId, { orderBy: "name", ascending: true });
    projects = ps.map((p) => ({ id: p.id, name: p.name }));
  }
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.wip.eyebrow", undefined, "Finance")}
        title={t("console.finance.wip.new.title", undefined, "New WIP Snapshot")}
        subtitle={t(
          "console.finance.wip.new.subtitle",
          undefined,
          "One per project per snapshot date. Revised contract, EAC, earned revenue, and over/under-billing are computed from these inputs.",
        )}
      />
      <div className="page-content max-w-2xl">
        <NewWipSnapshotForm projects={projects} />
      </div>
    </>
  );
}
