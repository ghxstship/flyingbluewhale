import { ModuleHeader } from "@/components/Shell";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { VoucherBatchForm } from "../../VoucherBatchForm";

export const dynamic = "force-dynamic";

/** /legend/store/admin/vouchers/new — mint a batch of voucher codes. */
export default async function NewVoucherBatchPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.storeAdmin.eyebrow", undefined, "LEG3ND · Manage")}
          title={t("console.legend.storeAdmin.newBatch", undefined, "New Voucher Batch")}
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
        title={t("console.legend.storeAdmin.newBatch", undefined, "New Voucher Batch")}
        subtitle={t(
          "console.legend.storeAdmin.newBatchSubtitle",
          undefined,
          "Codes are generated for you and appear in the register once minted.",
        )}
      />
      <VoucherBatchForm />
    </>
  );
}
