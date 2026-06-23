import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { getRequestT } from "@/lib/i18n/request";

export default async function ConsoleNotFound() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.notFound.eyebrow", undefined, "404")}
        title={t("console.notFound.title", undefined, "Not Found")}
        subtitle={t("console.notFound.subtitle", undefined, "That record doesn't exist, or you don't have access.")}
      />
      <div className="page-content">
        <div className="surface p-6">
          <Button href="/studio">{t("console.notFound.backToWorkspace", undefined, "Back to Workspace")}</Button>
        </div>
      </div>
    </>
  );
}
