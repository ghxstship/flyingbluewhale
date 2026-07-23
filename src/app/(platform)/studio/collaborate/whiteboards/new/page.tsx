import { ModuleHeader } from "@/components/Shell";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { hasSupabase } from "@/lib/env";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { WhiteboardForm } from "../WhiteboardForm";
import { createWhiteboardAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewWhiteboardPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.collaborate.whiteboards.eyebrow", undefined, "Projects · Plan")}
          title={t("console.collaborate.whiteboards.new.title", undefined, "New Whiteboard")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  await requireSession();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.collaborate.whiteboards.eyebrow", undefined, "Projects · Plan")}
        title={t("console.collaborate.whiteboards.new.title", undefined, "New Whiteboard")}
        breadcrumbs={[
          { label: t("console.collaborate.whiteboards.eyebrow", undefined, "Projects · Plan") },
          {
            label: t("console.collaborate.whiteboards.title", undefined, "Whiteboards"),
            href: "/studio/collaborate/whiteboards",
          },
          { label: t("console.collaborate.whiteboards.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-xl">
        <WhiteboardForm
          action={createWhiteboardAction}
          submitLabel={t("console.collaborate.whiteboards.new.submit", undefined, "Create Whiteboard")}
        />
      </div>
    </>
  );
}
