import { ModuleHeader } from "@/components/Shell";
import { NewPromoterForm } from "./NewPromoterForm";

export default function NewPromoterPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Commerce"
        title="New Promoter"
        breadcrumbs={[
          { label: "Marketplace", href: "/studio/marketplace" },
          { label: "Discounts", href: "/studio/marketplace/discounts" },
          { label: "Promoters", href: "/studio/marketplace/discounts/promoters" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewPromoterForm />
      </div>
    </>
  );
}
