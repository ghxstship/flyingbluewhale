import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { createCostCenterAction } from "../actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function NewCostCenterPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.hub.financeCodes.eyebrow", undefined, "Organization Hub")}
          title={t("console.legend.hub.financeCodes.new.title", undefined, "New Cost Center")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  await requireSession();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.financeCodes.eyebrow", undefined, "Organization Hub")}
        title={t("console.legend.hub.financeCodes.new.title", undefined, "New Cost Center")}
        subtitle={t(
          "console.legend.hub.financeCodes.new.subtitle",
          undefined,
          "Add a GL code on the XPMS canon. Budget lines and requisitions code against these.",
        )}
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.legend.hub.financeCodes.title", undefined, "Finance Codes"), href: "/legend/hub/finance-codes" },
          { label: t("console.legend.hub.financeCodes.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createCostCenterAction}
          cancelHref="/legend/hub/finance-codes"
          submitLabel={t("console.legend.hub.financeCodes.new.submit", undefined, "Create Cost Center")}
        >
          <Input
            label={t("console.legend.hub.financeCodes.new.code", undefined, "Code")}
            name="code"
            required
            maxLength={4}
            placeholder="5100"
            pattern="\d{4}"
            hint={t(
              "console.legend.hub.financeCodes.new.codeHint",
              undefined,
              "Four digits. The 10 department classes end in 000 (0000 Executive through 9000 Technology); sub-codes like 5100 nest under their class.",
            )}
          />
          <Input
            label={t("console.legend.hub.financeCodes.new.name", undefined, "Name")}
            name="name"
            required
            maxLength={120}
            placeholder={t("console.legend.hub.financeCodes.new.namePlaceholder", undefined, "Stage Production")}
          />
        </FormShell>
      </div>
    </>
  );
}
