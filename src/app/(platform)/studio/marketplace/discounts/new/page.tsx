import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { NewDiscountForm } from "./NewDiscountForm";

export default async function NewDiscountPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.discounts.eyebrow", undefined, "Sales")}
        title={t("console.marketplace.discounts.new.title", undefined, "New Discount Code")}
        breadcrumbs={[
          {
            label: t("console.marketplace.discounts.breadcrumb.marketplace", undefined, "Marketplace"),
            href: "/studio/marketplace",
          },
          {
            label: t("console.marketplace.discounts.title", undefined, "Discounts"),
            href: "/studio/marketplace/discounts",
          },
          { label: t("console.marketplace.discounts.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewDiscountForm />
      </div>
    </>
  );
}
