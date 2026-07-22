import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { createCostCenterAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewCostCenterPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Organization Hub" title="New Cost Center" />
        <ConfigureSupabase />
      </>
    );
  }
  await requireSession();

  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title="New Cost Center"
        subtitle="Add a GL code on the XPMS canon. Budget lines and requisitions code against these."
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Finance Codes", href: "/legend/hub/finance-codes" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell action={createCostCenterAction} cancelHref="/legend/hub/finance-codes" submitLabel="Create Cost Center">
          <Input
            label="Code"
            name="code"
            required
            maxLength={4}
            placeholder="5100"
            pattern="\d{4}"
            hint="Four digits. The 10 department classes end in 000 (0000 Executive through 9000 Technology); sub-codes like 5100 nest under their class."
          />
          <Input label="Name" name="name" required maxLength={120} placeholder="Stage Production" />
        </FormShell>
      </div>
    </>
  );
}
