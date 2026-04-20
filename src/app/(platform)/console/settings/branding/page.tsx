export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { safeBranding } from "@/lib/branding";
import { BrandingForm } from "./BrandingForm";

export default async function BrandingPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("orgs")
    .select("id, name, name_override, logo_url, branding")
    .eq("id", session.orgId)
    .maybeSingle();
  const branding = safeBranding(org?.branding ?? {});
  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Branding"
        subtitle="Logo, colors, and customization. Applied across every shell and PDF export."
      />
      <div className="page-content max-w-4xl space-y-4">
        <BrandingForm
          initial={{
            productName: org?.name_override ?? "",
            logoUrl: org?.logo_url ?? "",
            accentColor: branding.accentColor ?? "",
            accentForeground: branding.accentForeground ?? "",
            faviconUrl: branding.faviconUrl ?? "",
            heroImageUrl: branding.heroImageUrl ?? "",
            ogImageUrl: branding.ogImageUrl ?? "",
          }}
        />
      </div>
    </>
  );
}
