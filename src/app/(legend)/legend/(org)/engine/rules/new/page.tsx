import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { RuleForm } from "../RuleForm";
import { getRequestT } from "@/lib/i18n/request";

export default async function NewRulePage() {
  const { t } = await getRequestT();
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.engine.eyebrow", undefined, "LEG3ND · XMCE")}
        title={t("console.legend.engine.rule.newTitle", undefined, "New Compliance Rule")}
      />
      <div className="page-content max-w-2xl">
        <RuleForm />
      </div>
    </>
  );
}
