import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createProductAction } from "../../actions";
import { ProductForm } from "../../ProductForm";

export const dynamic = "force-dynamic";

/** /legend/store/admin/products/new — stock a new credit pack or item. */
export default async function NewStoreProductPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.storeAdmin.eyebrow", undefined, "LEG3ND · Manage")}
          title={t("console.legend.storeAdmin.newProduct", undefined, "New Product")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend/store" />;
  }
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.storeAdmin.eyebrow", undefined, "LEG3ND · Manage")}
        title={t("console.legend.storeAdmin.newProduct", undefined, "New Product")}
        subtitle={t(
          "console.legend.storeAdmin.newProductSubtitle",
          undefined,
          "A pack is bought with money and grants credits. An item is redeemed with credits.",
        )}
      />
      <ProductForm action={createProductAction} submitLabel={t("console.legend.storeAdmin.create", undefined, "Create Product")} />
    </>
  );
}
