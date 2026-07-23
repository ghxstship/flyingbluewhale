import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { setPositionActiveAction, updatePositionAction } from "../actions";
import { PositionForm, type Department, type PositionRow } from "../PositionForm";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function PositionDetailPage({
  params,
}: {
  params: Promise<{ positionId: string }>;
}) {
  const { positionId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.hub.organization.eyebrow", undefined, "Organization Hub")}
          title={t("console.legend.hub.organization.detail.title", undefined, "Position")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: position }, { data: departmentData }] = await Promise.all([
    db
      .from("positions")
      .select("id, title, department_code, summary, active")
      .eq("org_id", session.orgId)
      .eq("id", positionId)
      .maybeSingle(),
    db.from("dim_department").select("code, label").order("code", { ascending: true }).limit(20),
  ]);
  if (!position) notFound();
  const row = position as PositionRow;
  const departments = (departmentData ?? []) as Department[];
  const deptLabel = departments.find((d) => d.code === row.department_code)?.label;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.organization.eyebrow", undefined, "Organization Hub")}
        title={row.title}
        subtitle={
          row.department_code
            ? `${row.department_code} · ${deptLabel ?? t("console.legend.hub.organization.detail.department", undefined, "Department")}`
            : t("console.legend.hub.organization.detail.unclassified", undefined, "Unclassified position")
        }
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.legend.hub.organization.title", undefined, "Organization"), href: "/legend/hub/organization" },
          { label: row.title },
        ]}
        action={
          <div className="flex items-center gap-3">
            {row.active ? (
              <Badge variant="success">{t("console.legend.hub.organization.active", undefined, "Active")}</Badge>
            ) : (
              <Badge variant="muted">{t("console.legend.hub.organization.archived", undefined, "Archived")}</Badge>
            )}
            <form action={setPositionActiveAction.bind(null, row.id, !row.active)}>
              <Button type="submit" size="sm" variant="secondary">
                {row.active
                  ? t("console.legend.hub.organization.detail.archive", undefined, "Archive")
                  : t("console.legend.hub.organization.detail.restore", undefined, "Restore")}
              </Button>
            </form>
          </div>
        }
      />
      <div className="page-content max-w-2xl">
        <PositionForm
          action={updatePositionAction.bind(null, row.id)}
          departments={departments}
          position={row}
          submitLabel={t("console.legend.hub.organization.detail.submit", undefined, "Save Position")}
        />
      </div>
    </>
  );
}
