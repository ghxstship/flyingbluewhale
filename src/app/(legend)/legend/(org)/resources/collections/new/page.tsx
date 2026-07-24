import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { CollectionForm } from "../CollectionForm";
import { createCollectionAction } from "../actions";
import { getRequestT } from "@/lib/i18n/request";

export default async function NewCollectionPage() {
  const { t } = await getRequestT();
  // Authoring is page-gated to match the engine/teach denial UX (S-4).
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend/resources/collections" />;
  }
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.resources.eyebrow", undefined, "LEG3ND")}
        title={t("console.legend.resources.newCollectionTitle", undefined, "New Collection")}
        breadcrumbs={[
          { label: t("console.legend.resources.eyebrow", undefined, "LEG3ND") },
          { label: t("console.legend.resources.title", undefined, "Resources"), href: "/legend/resources" },
          { label: t("console.legend.resources.collectionsTitle", undefined, "Collections"), href: "/legend/resources/collections" },
          { label: t("console.legend.resources.newCollectionBreadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <CollectionForm
          action={createCollectionAction}
          submitLabel={t("console.legend.resources.createCollectionSubmit", undefined, "Create Collection")}
        />
      </div>
    </>
  );
}
