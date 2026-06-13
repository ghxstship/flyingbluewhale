import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { safeBranding } from "@/lib/branding";
import { ClientBrandingForm } from "./ClientBrandingForm";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, name, branding, logo_url")
    .eq("org_id", session.orgId)
    .eq("id", clientId)
    .maybeSingle();
  if (!client) notFound();

  const b = safeBranding(client.branding);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.clients.branding.eyebrow", undefined, "Client")}
        title={t("console.clients.branding.title", undefined, "Brand")}
        subtitle={t(
          "console.clients.branding.subtitle",
          undefined,
          "The client's logo + colors used in the proposal co-brand lockup and invoice bill-to.",
        )}
      />
      <div className="page-content max-w-3xl">
        <ClientBrandingForm
          initial={{
            clientId: client.id,
            clientName: client.name,
            logoUrl: client.logo_url ?? b.logoUrl ?? "",
            accentColor: b.accentColor ?? "",
            accentForeground: b.accentForeground ?? "",
            secondaryColor: b.secondaryColor ?? "",
          }}
        />
      </div>
    </>
  );
}
