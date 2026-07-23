import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { renameCostCenterAction, setCostCenterActiveAction } from "../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Cost-center detail: rename in place + activate/deactivate (positions
 * pattern). The code is immutable — budget lines and XPMS coordinates
 * reference it.
 */
export default async function CostCenterDetailPage({
  params,
}: {
  params: Promise<{ costCenterId: string }>;
}) {
  const { costCenterId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.hub.financeCodes.eyebrow", undefined, "Organization Hub")}
          title={t("console.legend.hub.financeCodes.detail.title", undefined, "Cost Center")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data } = await db
    .from("cost_centers")
    .select("id, code, name, active, scope")
    .eq("org_id", session.orgId)
    .eq("id", costCenterId)
    .maybeSingle();
  if (!data) notFound();
  const row = data as { id: string; code: string; name: string; active: boolean; scope: string };

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.financeCodes.eyebrow", undefined, "Organization Hub")}
        title={`${row.code} · ${row.name}`}
        subtitle={t(
          "console.legend.hub.financeCodes.detail.subtitle",
          undefined,
          "Rename the cost center or take it out of circulation. The code itself never changes.",
        )}
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.legend.hub.financeCodes.title", undefined, "Finance Codes"), href: "/legend/hub/finance-codes" },
          { label: row.code },
        ]}
        action={
          <div className="flex items-center gap-3">
            {row.active ? (
              <Badge variant="success">{t("console.legend.hub.financeCodes.active", undefined, "Active")}</Badge>
            ) : (
              <Badge variant="muted">{t("console.legend.hub.financeCodes.inactive", undefined, "Inactive")}</Badge>
            )}
            <form action={setCostCenterActiveAction.bind(null, row.id, !row.active)}>
              <Button type="submit" size="sm" variant="secondary">
                {row.active
                  ? t("console.legend.hub.financeCodes.detail.deactivate", undefined, "Deactivate")
                  : t("console.legend.hub.financeCodes.detail.reactivate", undefined, "Reactivate")}
              </Button>
            </form>
          </div>
        }
      />
      <div className="page-content max-w-2xl space-y-4">
        <section className="surface-inset flex items-baseline gap-4 p-4">
          <div>
            <div className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.legend.hub.financeCodes.detail.code", undefined, "Code")}
            </div>
            <div className="ps-id text-lg text-[var(--p-text-1)]">{row.code}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.legend.hub.financeCodes.detail.scope", undefined, "Scope")}
            </div>
            <div className="text-sm text-[var(--p-text-1)]">{row.scope}</div>
          </div>
        </section>
        <FormShell
          action={renameCostCenterAction.bind(null, row.id)}
          cancelHref="/legend/hub/finance-codes"
          submitLabel={t("console.legend.hub.financeCodes.detail.submit", undefined, "Save Name")}
        >
          <Input
            label={t("console.legend.hub.financeCodes.detail.name", undefined, "Name")}
            name="name"
            required
            maxLength={120}
            defaultValue={row.name}
          />
        </FormShell>
      </div>
    </>
  );
}
