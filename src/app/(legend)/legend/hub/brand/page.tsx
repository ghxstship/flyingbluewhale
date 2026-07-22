import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { safeBranding } from "@/lib/branding";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

/**
 * Brand Studio (MIRROR). Renders the org's current brand identity from
 * `orgs.{name,name_override,logo_url,branding}` read-only; edits stay in the
 * console at /studio/settings/branding until the canonical-home move
 * (post-P5 backlog item 1).
 */

function Swatch({ label, hex }: { label: string; hex?: string }) {
  return (
    <div className="surface-inset flex items-center gap-3 p-3">
      <span
        aria-hidden="true"
        className="h-8 w-8 shrink-0 rounded-[var(--p-r-md)] border border-[var(--p-border)]"
        style={hex ? { backgroundColor: hex } : undefined}
      />
      <div className="min-w-0">
        <div className="text-xs font-medium text-[var(--p-text-2)]">{label}</div>
        <div className="ps-id text-sm text-[var(--p-text-1)]">{hex ?? "Not set"}</div>
      </div>
    </div>
  );
}

function UrlRow({ label, url }: { label: string; url?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--p-border)] py-2 last:border-b-0">
      <span className="shrink-0 text-xs font-medium text-[var(--p-text-2)]">{label}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="focus-ring truncate text-sm text-[var(--p-accent-text)] hover:underline"
        >
          {url}
        </a>
      ) : (
        <span className="text-sm text-[var(--p-text-3)]">Not set</span>
      )}
    </div>
  );
}

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
  const displayName = org?.name_override || org?.name || "Your organization";

  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title="Brand Studio"
        subtitle="Your identity as every shell, proposal, and PDF renders it. Editing lives in the console for now."
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Brand Studio" },
        ]}
        action={
          <Button href={urlFor("platform", "/settings/branding")} size="sm">
            Edit in console
          </Button>
        }
      />
      <div className="page-content max-w-4xl space-y-6">
        <section className="surface p-6">
          <div className="flex items-center gap-5">
            {org?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logo_url}
                alt={`${displayName} logo`}
                className="h-16 w-16 shrink-0 rounded-[var(--p-r-md)] border border-[var(--p-border)] object-contain"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--p-r-md)] border border-dashed border-[var(--p-border)] text-xs text-[var(--p-text-3)]">
                No logo
              </div>
            )}
            <div className="min-w-0">
              <h2 className="ps-h text-xl">{displayName}</h2>
              <p className="mt-0.5 text-sm text-[var(--p-text-2)]">
                {org?.name && org?.name_override && org.name_override !== org.name
                  ? `Legal name ${org.name}`
                  : "Display and legal name"}
                {org?.slug ? ` · ${org.slug}` : ""}
              </p>
              {branding.wordmark ? (
                <p className="ps-id mt-1 text-sm tracking-widest text-[var(--p-text-1)]">{branding.wordmark}</p>
              ) : null}
            </div>
            <div className="ml-auto">
              <Badge variant="muted">Mirror</Badge>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--p-text-1)]">Colors</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Swatch label="Accent" hex={branding.accentColor} />
            <Swatch label="On accent" hex={branding.accentForeground} />
            <Swatch label="Secondary" hex={branding.secondaryColor} />
          </div>
          <p className="text-xs text-[var(--p-text-3)]">
            Unset colors fall back to the product accent for the surface rendering them.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--p-text-1)]">Type</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="surface-inset p-3">
              <div className="text-xs font-medium text-[var(--p-text-2)]">Heading font</div>
              <div className="text-sm text-[var(--p-text-1)]">{branding.headingFont ?? "Platform default"}</div>
            </div>
            <div className="surface-inset p-3">
              <div className="text-xs font-medium text-[var(--p-text-2)]">Body font</div>
              <div className="text-sm text-[var(--p-text-1)]">{branding.bodyFont ?? "Platform default"}</div>
            </div>
          </div>
        </section>

        <section className="surface space-y-1 p-6">
          <h2 className="text-sm font-semibold text-[var(--p-text-1)]">Assets</h2>
          <UrlRow label="Logo" url={org?.logo_url ?? undefined} />
          <UrlRow label="Favicon" url={branding.faviconUrl} />
          <UrlRow label="Hero image" url={branding.heroImageUrl} />
          <UrlRow label="Social card" url={branding.ogImageUrl} />
        </section>
      </div>
    </>
  );
}
