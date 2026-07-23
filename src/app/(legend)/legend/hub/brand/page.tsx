import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { safeBranding } from "@/lib/branding";
import { BrandingForm } from "./BrandingForm";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Brand Studio (canonical home, decision 6 rider). The full org-branding
 * read/write surface lives here; /studio/settings/branding redirects in.
 * The form + WCAG contrast guard moved verbatim from the console.
 */
export default async function BrandStudioPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.hub.brand.eyebrow", undefined, "Organization Hub")}
          title={t("console.legend.hub.brand.title", undefined, "Brand Studio")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = await createClient();
  const { data: org } = await db
    .from("orgs")
    .select("id, name, slug, name_override, logo_url, branding")
    .eq("id", session.orgId)
    .maybeSingle();
  const branding = safeBranding(org?.branding ?? {});

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.brand.eyebrow", undefined, "Organization Hub")}
        title={t("console.legend.hub.brand.title", undefined, "Brand Studio")}
        subtitle={t(
          "console.legend.hub.brand.subtitle",
          undefined,
          "Your identity as every shell, proposal, and PDF renders it. Saved changes apply everywhere.",
        )}
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.legend.hub.brand.title", undefined, "Brand Studio") },
        ]}
      />
      <div className="page-content max-w-4xl space-y-4">
        <BrandingForm
          initial={{
            productName: org?.name_override ?? "",
            logoUrl: org?.logo_url ?? "",
            accentColor: branding.accentColor ?? "",
            accentForeground: branding.accentForeground ?? "",
            secondaryColor: branding.secondaryColor ?? "",
            faviconUrl: branding.faviconUrl ?? "",
            heroImageUrl: branding.heroImageUrl ?? "",
            ogImageUrl: branding.ogImageUrl ?? "",
          }}
        />
      </div>
    </>
  );
}
