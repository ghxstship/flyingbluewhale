import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { NewSignForm } from "./NewSignForm";
import { getRequestT } from "@/lib/i18n/request";

export default async function NewSignPage() {
  const { t } = await getRequestT();
  // Authoring is page-gated to match the engine/teach denial UX (S-4):
  // non-managers get AccessDenied instead of a form whose action refuses.
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend/signage" />;
  }
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.signage.eyebrow", undefined, "LEG3ND")}
        title={t("console.legend.signage.new.title", undefined, "New Sign")}
      />
      <div className="page-content max-w-2xl">
        <NewSignForm />
      </div>
    </>
  );
}
