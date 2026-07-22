import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewLocationForm } from "./NewLocationForm";

export const dynamic = "force-dynamic";

export default async function NewLocationPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title={t("console.locations.new.title", undefined, "Add Location")}
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Locations", href: "/legend/hub/locations" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-xl">
        <NewLocationForm />
      </div>
    </>
  );
}
