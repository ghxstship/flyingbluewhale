import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { CreditProduct } from "@/lib/legend_store";
import { getRequestT } from "@/lib/i18n/request";
import { updateProductAction } from "../../actions";
import { ProductForm } from "../../ProductForm";

export const dynamic = "force-dynamic";

/** /legend/store/admin/products/[productId] — edit a stocked product. */
export default async function EditStoreProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { t } = await getRequestT();
  const { productId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.storeAdmin.eyebrow", undefined, "LEG3ND · Manage")}
          title={t("console.legend.storeAdmin.editProduct", undefined, "Edit Product")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend/store" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("credit_products")
    .select("*")
    .eq("org_id", session.orgId)
    .eq("id", productId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  const product = data as CreditProduct;

  const boundUpdate = updateProductAction.bind(null, product.id);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.storeAdmin.eyebrow", undefined, "LEG3ND · Manage")}
        title={product.name}
        subtitle={t("console.legend.storeAdmin.editSubtitle", undefined, "Edit the product, then save.")}
      />
      <ProductForm action={boundUpdate} product={product} submitLabel={t("console.legend.storeAdmin.save", undefined, "Save Changes")} />
    </>
  );
}
