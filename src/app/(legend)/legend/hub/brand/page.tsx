import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { safeBranding } from "@/lib/branding";
import { BrandingForm } from "./BrandingForm";

export const dynamic = "force-dynamic";

/**
 * Brand Studio (canonical home, decision 6 rider). The full org-branding
 * read/write surface lives here; /studio/settings/branding redirects in.
 * The form + WCAG contrast guard moved verbatim from the console.
 */
export default async function BrandStudioPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Organization Hub" title="Brand Studio" />
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
        eyebrow="Organization Hub"
        title="Brand Studio"
        subtitle="Your identity as every shell, proposal, and PDF renders it. Saved changes apply everywhere."
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Brand Studio" },
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
