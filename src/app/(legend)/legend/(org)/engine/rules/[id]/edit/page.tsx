import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { RuleForm } from "../../RuleForm";
import type { ComplianceRuleRow } from "../../../types";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function EditRulePage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.engine.eyebrow", undefined, "LEG3ND · XMCE")}
          title={t("console.legend.engine.rule.editTitle", undefined, "Edit Compliance Rule")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const { id } = await params;
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("compliance_rules")
    .select("id, org_id, code, title, description, severity, category, rule_state, created_at, updated_at, deleted_at")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const rule = data as ComplianceRuleRow | null;
  if (!rule) notFound();

  return (
    <>
      <ModuleHeader eyebrow={rule.code} title={t("console.legend.engine.rule.editTitle", undefined, "Edit Compliance Rule")} />
      <div className="page-content max-w-2xl">
        <RuleForm rule={rule} />
      </div>
    </>
  );
}
