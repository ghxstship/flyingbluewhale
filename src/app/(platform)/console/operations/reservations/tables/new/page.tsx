import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewTableForm } from "./NewTableForm";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.reservations.tables.new.eyebrow", undefined, "Venue Ops")}
        title={t("console.reservations.tables.new.title", undefined, "New Table")}
        breadcrumbs={[
          { label: t("console.reservations.title", undefined, "Reservations"), href: "/console/operations/reservations" },
          { label: t("console.reservations.tables.new.title", undefined, "New Table") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewTableForm />
      </div>
    </>
  );
}
