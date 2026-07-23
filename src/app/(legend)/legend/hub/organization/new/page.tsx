import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { createPositionAction } from "../actions";
import { PositionForm, type Department } from "../PositionForm";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function NewPositionPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.hub.organization.eyebrow", undefined, "Organization Hub")}
          title={t("console.legend.hub.organization.new.title", undefined, "New Position")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data: departmentData } = await db
    .from("dim_department")
    .select("code, label")
    .order("code", { ascending: true })
    .limit(20);
  const departments = (departmentData ?? []) as Department[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.organization.eyebrow", undefined, "Organization Hub")}
        title={t("console.legend.hub.organization.new.title", undefined, "New Position")}
        subtitle={t(
          "console.legend.hub.organization.new.subtitle",
          undefined,
          "Add a position to the library. Rosters and role assignment read from here.",
        )}
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.legend.hub.organization.title", undefined, "Organization"), href: "/legend/hub/organization" },
          { label: t("console.legend.hub.organization.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <PositionForm
          action={createPositionAction}
          departments={departments}
          submitLabel={t("console.legend.hub.organization.new.submit", undefined, "Create Position")}
        />
      </div>
    </>
  );
}
