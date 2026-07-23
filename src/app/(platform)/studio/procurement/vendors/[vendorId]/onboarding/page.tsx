import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestT } from "@/lib/i18n/request";
import { OnboardingChecklist, type OnboardingItem } from "./OnboardingChecklist";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.procurement.vendorOnboarding.eyebrow", undefined, "Vendor")}
          title={t("console.procurement.vendorOnboarding.title", undefined, "Onboarding")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.vendorOnboarding.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const { vendorId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("id", vendorId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!vendor) notFound();

  const db = supabase as unknown as LooseSupabase;
  const { data } = await db
    .from("vendor_onboarding_items")
    .select("id, label, required, item_state, completed_at")
    .eq("org_id", session.orgId)
    .eq("vendor_id", vendorId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const items = (data ?? []) as OnboardingItem[];

  const required = items.filter((i) => i.required);
  const requiredDone = required.filter((i) => i.item_state === "approved" || i.item_state === "waived").length;
  const pct = required.length === 0 ? 0 : Math.round((requiredDone / required.length) * 100);
  const status =
    items.length === 0
      ? {
          label: t("console.procurement.vendorOnboarding.notStarted", undefined, "Not started"),
          variant: "muted" as const,
        }
      : requiredDone === required.length
        ? {
            label: t("console.procurement.vendorOnboarding.complete", undefined, "Complete"),
            variant: "success" as const,
          }
        : {
            label: t("console.procurement.vendorOnboarding.inProgress", undefined, "In progress"),
            variant: "info" as const,
          };

  return (
    <>
      <ModuleHeader
        eyebrow={(vendor as { name: string }).name}
        title={t("console.procurement.vendorOnboarding.title", undefined, "Onboarding")}
        subtitle={t(
          "console.procurement.vendorOnboarding.subtitle",
          { done: requiredDone, total: required.length },
          `${requiredDone}/${required.length} required items cleared`,
        )}
        action={<Badge variant={status.variant}>{status.label}</Badge>}
      />
      <div className="page-content max-w-3xl space-y-5">
        {required.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[var(--p-text-2)]">
              <span>
                {t("console.procurement.vendorOnboarding.requiredCompletion", undefined, "Required completion")}
              </span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <ProgressBar value={pct} />
          </div>
        ) : null}
        <OnboardingChecklist vendorId={vendorId} items={items} />
      </div>
    </>
  );
}
