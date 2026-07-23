import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { safeBranding, resolveBrand } from "@/lib/branding";
import { BrandKitPreview } from "@/components/branding/BrandKitPreview";
import { urlFor } from "@/lib/urls";
import { getRequestT } from "@/lib/i18n/request";
import { BrandingForm } from "./BrandingForm";

export const dynamic = "force-dynamic";

/**
 * Brand Studio (canonical home, decision 6 rider + L-P3 studio build-out).
 * Four sections:
 *   1. the org-branding editor (the full read/write surface; the console URL
 *      /studio/settings/branding redirects in),
 *   2. Event brand kits — per-project overrides, deep-linking into the
 *      existing /studio/projects/[id]/branding form (never duplicated here),
 *   3. a live preview of the currently-resolved org brand (doc masthead,
 *      portal chrome, ticket/pass) via the canonical `resolveBrand`,
 *   4. the document white-label modes (`data-brand` atlvs/co/white) explained.
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
  const [{ data: org }, { data: projects }] = await Promise.all([
    db
      .from("orgs")
      .select("id, name, slug, name_override, logo_url, branding")
      .eq("id", session.orgId)
      .maybeSingle(),
    db
      .from("projects")
      .select("id, name, branding, created_at")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const branding = safeBranding(org?.branding ?? {});

  // Resolve the org-level brand once through the canonical resolver — the
  // preview renders exactly what documents/portals/PDFs will resolve.
  const resolved = resolveBrand({ org: org ?? { name: null } });

  // Event brand kits: projects carrying at least one sanitized override.
  const withKit = (projects ?? []).filter((p) => Object.keys(safeBranding(p.branding)).length > 0);
  const withoutKit = (projects ?? []).filter((p) => Object.keys(safeBranding(p.branding)).length === 0);

  const modes: { value: string; name: string; body: string }[] = [
    {
      value: "atlvs",
      name: t("console.legend.hub.brand.modes.atlvs.name", undefined, "ATLVS"),
      body: t(
        "console.legend.hub.brand.modes.atlvs.body",
        undefined,
        "The default. Full ATLVS ecosystem chrome; your logo and name still appear in the masthead.",
      ),
    },
    {
      value: "co",
      name: t("console.legend.hub.brand.modes.co.name", undefined, "Co-brand"),
      body: t(
        "console.legend.hub.brand.modes.co.body",
        undefined,
        'Your brand leads. Your accent repaints the document and a small "Powered by ATLVS" line remains.',
      ),
    },
    {
      value: "white",
      name: t("console.legend.hub.brand.modes.white.name", undefined, "White label"),
      body: t(
        "console.legend.hub.brand.modes.white.body",
        undefined,
        "Your brand only. Zero ATLVS marks anywhere on the document. Available on every document and report.",
      ),
    },
  ];

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

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("console.legend.hub.brand.eventKits.title", undefined, "Event brand kits")}
          </h3>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.legend.hub.brand.eventKits.description",
              undefined,
              "Per-project overrides for the portal and client-facing artifacts. A project without a kit inherits the organization brand above.",
            )}
          </p>
          {withKit.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {withKit.map((p) => {
                const kit = resolveBrand({ org: org ?? { name: null }, project: p });
                return (
                  <li key={p.id}>
                    <Link
                      href={urlFor("platform", `/projects/${p.id}/branding`)}
                      className="hover-lift focus-ring flex items-center gap-3 rounded-[var(--p-r-md)] border border-[var(--p-border)] px-3 py-2.5"
                    >
                      <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
                        <span
                          className="h-5 w-5 rounded border border-[var(--p-border)]"
                          style={{ background: kit.context.joint.accent }}
                        />
                        <span
                          className="h-5 w-2.5 rounded border border-[var(--p-border)]"
                          style={{ background: kit.context.joint.secondary }}
                        />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                      <span className="ps-id shrink-0 text-xs text-[var(--p-text-2)]">
                        {kit.context.joint.accent}
                      </span>
                      <span className="shrink-0 text-xs font-medium text-[var(--p-accent-text,var(--p-accent))]">
                        {t("console.legend.hub.brand.eventKits.edit", undefined, "Edit kit")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[var(--p-text-2)]">
              {t(
                "console.legend.hub.brand.eventKits.empty",
                undefined,
                "No project carries a brand kit yet. Every project renders under the organization brand until you create one.",
              )}
            </p>
          )}
          {withoutKit.length > 0 && (
            <div className="mt-4 border-t border-[var(--p-border)] pt-3">
              <div className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.legend.hub.brand.eventKits.createFor", undefined, "Create a kit for")}
              </div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {withoutKit.slice(0, 8).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={urlFor("platform", `/projects/${p.id}/branding`)}
                      className="ps-btn ps-btn--ghost ps-btn--sm"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("console.legend.hub.brand.resolvedPreview.title", undefined, "Resolved brand preview")}
          </h3>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.legend.hub.brand.resolvedPreview.description",
              undefined,
              "Rendered from the saved organization brand, through the same resolver that paints documents, portals, and PDFs. Project kits override this on their own surfaces.",
            )}
          </p>
          <div className="mt-4">
            <BrandKitPreview
              context={resolved.context}
              labels={{
                docMasthead: t("console.legend.hub.brand.resolvedPreview.docMasthead", undefined, "Document masthead"),
                docType: t("console.legend.hub.brand.resolvedPreview.docType", undefined, "Proposal"),
                docNo: "PRO-2026-001",
                portalChrome: t("console.legend.hub.brand.resolvedPreview.portalChrome", undefined, "Portal chrome"),
                portalCta: t("console.legend.hub.brand.resolvedPreview.portalCta", undefined, "Approve"),
                portalNavItem: t("console.legend.hub.brand.resolvedPreview.portalNavItem", undefined, "Overview"),
                pass: t("console.legend.hub.brand.resolvedPreview.pass", undefined, "Ticket and pass"),
                passKind: t("console.legend.hub.brand.resolvedPreview.passKind", undefined, "Event pass"),
                passZone: t("console.legend.hub.brand.resolvedPreview.passZone", undefined, "Zone A · All areas"),
              }}
            />
          </div>
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("console.legend.hub.brand.modes.title", undefined, "Document white-label modes")}
          </h3>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.legend.hub.brand.modes.description",
              undefined,
              "Every document and report carries a brand toggle. The three modes, honestly:",
            )}
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {modes.map((m) => (
              <li key={m.value} className="rounded-[var(--p-r-md)] border border-[var(--p-border)] p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold">{m.name}</span>
                  <code className="ps-id text-[11px] text-[var(--p-text-2)]">data-brand=&quot;{m.value}&quot;</code>
                </div>
                <p className="mt-1.5 text-xs text-[var(--p-text-2)]">{m.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
