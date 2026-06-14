import { ModuleHeader } from "@/components/Shell";
import { NewPromoterForm } from "./NewPromoterForm";

export default function NewPromoterPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Commerce"
        title="New Promoter"
        breadcrumbs={[
          { label: "Marketplace", href: "/console/marketplace" },
          { label: "Discounts", href: "/console/marketplace/discounts" },
          { label: "Promoters", href: "/console/marketplace/discounts/promoters" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewPromoterForm />
      </div>
    </>
  );
}
