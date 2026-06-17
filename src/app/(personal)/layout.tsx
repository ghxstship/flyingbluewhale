import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { Wordmark } from "@/components/brand/Wordmark";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { personalNavGroups } from "@/lib/nav";

export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
  // Outer auth guard — matches (platform) and (mobile) shell convention.
  // Previously `/me/*` pages rendered chrome + empty forms to anon visitors,
  // leaking shell structure and risking partial data exposure through any
  // client component that assumed a session existed. UJV cell R1-R10·S1/S3.
  await requireSession();
  const tenant = await resolveTenant();
  const { t } = await getRequestT();
  // ADR-0010 Move 2: three-area grouping. Account = identity + access.
  // Activity = events happening to me. Marketplace = discovery + participation.
  // Same horizontal tab pattern; just rendered in 3 visually-separated
  // sections so users stop scanning a 17-leaf flat list. URLs unchanged.
  // Data SSOT: `personalNavGroups` in src/lib/nav.ts (reconciled by the
  // sitemap generator). Labels resolve via t(key, _, English fallback).
  const tabGroups = personalNavGroups.map((g) => ({
    label: t(g.labelKey, undefined, g.fallback),
    tabs: g.items.map((i) => ({ label: t(i.labelKey, undefined, i.fallback), href: i.href })),
  }));
  const brandName = tenant.branding.productName ?? tenant.orgName ?? "ATLVS";
  const brandAria = tenant.branding.productName ?? tenant.orgName ?? "ATLVS Technologies";
  const isDefaultBrand = !tenant.branding.productName && !tenant.orgName;
  return (
    <TenantShell tenant={tenant}>
      {/*
       * Theme lock — per v2 GHXSTSHIP handoff: /me is a per-user SaaS
       * surface, so it paints with the neutral atlvs-product skin (not
       * legacy cosmic skin). No data-platform here — /me is product-agnostic
       * so the theme's default accent (atlvs pink) is correct.
       */}
      <div data-ui="saas" data-theme="atlvs-product" data-product="atlvs" className="page-shell">
        <div className="mx-auto max-w-5xl px-6 pt-5">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-end gap-2 text-sm font-semibold tracking-tight text-[var(--p-text-1)]"
              aria-label={brandAria}
            >
              {tenant.branding.logoUrl ? (
                // White-label tenant logo overrides.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.branding.logoUrl} alt="" className="h-5 w-auto" />
              ) : isDefaultBrand ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/brand/atlvs-mark.svg" alt="" width={20} height={20} aria-hidden="true" />
              ) : null}
              {isDefaultBrand ? (
                <Wordmark word={brandName} style={{ fontSize: 14, fontWeight: 500 }} />
              ) : (
                <span>{brandName}</span>
              )}
            </Link>
            <ThemeToggle />
          </div>
          {/* ADR-0010 three-area nav: section labels render as quiet
              eyebrows over each tab group; tabs themselves keep the
              same `.nav-item` chrome the flat list used. */}
          <nav className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--p-border)] pb-2">
            {tabGroups.map((group, i) => (
              <div key={group.label} className="flex flex-wrap items-center gap-1">
                {i > 0 ? (
                  <span aria-hidden="true" className="text-[var(--p-text-2)]">
                    ·
                  </span>
                ) : null}
                <span className="me-0.5 text-[10px] font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
                  {group.label}
                </span>
                {group.tabs.map((tab) => (
                  <Link key={tab.href} href={tab.href} className="nav-item text-sm">
                    {tab.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <main id="main" tabIndex={-1} className="animate-page-enter mx-auto max-w-5xl px-6 py-8">
          {children}
        </main>
      </div>
    </TenantShell>
  );
}
