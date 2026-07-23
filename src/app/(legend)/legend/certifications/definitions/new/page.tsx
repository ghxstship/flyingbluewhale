import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { DefinitionForm } from "../DefinitionForm";
import { createCertificationAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCertificationDefinitionPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.certifications.definitions.eyebrow", undefined, "LEG3ND · Compliance")}
          title={t("console.legend.certifications.definitions.new.title", undefined, "New Credential Type")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend/certifications" />;
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.certifications.definitions.eyebrow", undefined, "LEG3ND · Compliance")}
        title={t("console.legend.certifications.definitions.new.title", undefined, "New Credential Type")}
        breadcrumbs={[
          { label: t("console.legend.certifications.definitions.breadcrumbRoot", undefined, "LEG3ND") },
          {
            label: t("console.legend.certifications.definitions.title", undefined, "Credential Types"),
            href: "/legend/certifications/definitions",
          },
          { label: t("console.legend.certifications.definitions.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <DefinitionForm
          action={createCertificationAction}
          submitLabel={t("console.legend.certifications.definitions.new.submit", undefined, "Create Credential Type")}
        />
      </div>
    </>
  );
}
