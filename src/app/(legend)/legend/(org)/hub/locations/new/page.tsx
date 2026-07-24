import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewLocationForm } from "./NewLocationForm";

export const dynamic = "force-dynamic";

export default async function NewLocationPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.title", undefined, "Organization Hub")}
        title={t("console.locations.new.title", undefined, "Add Location")}
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.locations.list.title", undefined, "Locations"), href: "/legend/hub/locations" },
          { label: t("console.locations.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-xl">
        <NewLocationForm />
      </div>
    </>
  );
}
