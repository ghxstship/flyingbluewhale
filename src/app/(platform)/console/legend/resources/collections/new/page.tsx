import { ModuleHeader } from "@/components/Shell";
import { CollectionForm } from "../CollectionForm";
import { createCollectionAction } from "../actions";

export default async function NewCollectionPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND"
        title="New Collection"
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Resources", href: "/console/legend/resources" },
          { label: "Collections", href: "/console/legend/resources/collections" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <CollectionForm action={createCollectionAction} submitLabel="Create Collection" />
      </div>
    </>
  );
}
