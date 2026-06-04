import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";

export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
  // Outer auth guard — matches (platform) and (mobile) shell convention.
  // Previously `/me/*` pages rendered chrome + empty forms to anon visitors,
  // leaking shell structure and risking partial data exposure through any
  // client component that assumed a session existed. UJV cell R1-R10·S1/S3.
  await requireSession();
  const tenant = await resolveTenant();
  const { t } = await getRequestT();
  const tabs = [
    { label: t("me.layout.tabs.dashboard", undefined, "Dashboard"), href: "/me" },
    { label: t("me.layout.tabs.profile", undefined, "Profile"), href: "/me/profile" },
    { label: t("me.layout.tabs.appearance", undefined, "Appearance"), href: "/me/settings/appearance" },
    { label: t("me.layout.tabs.settings", undefined, "Settings"), href: "/me/settings" },
    { label: t("me.layout.tabs.notifications", undefined, "Notifications"), href: "/me/notifications" },
    { label: t("me.layout.tabs.security", undefined, "Security"), href: "/me/security" },
    { label: t("me.layout.tabs.privacy", undefined, "Privacy"), href: "/me/privacy" },
    { label: t("me.layout.tabs.tickets", undefined, "Tickets"), href: "/me/tickets" },
    { label: t("me.layout.tabs.organizations", undefined, "Organizations"), href: "/me/organizations" },
  ];
  const brandName = tenant.branding.productName ?? tenant.orgName ?? "A T L V S";
  const brandAria = tenant.branding.productName ?? tenant.orgName ?? "ATLVS Technologies";
  const isDefaultBrand = !tenant.branding.productName && !tenant.orgName;
  return (
    <TenantShell tenant={tenant}>
      {/*
       * Theme lock — per v2 GHXSTSHIP handoff: /me is a per-user SaaS
       * surface, so it paints with the neutral atlvs-product skin (not
       * cosmic ghxstship). No data-platform here — /me is product-agnostic
       * so the theme's default accent (atlvs pink) is correct.
       */}
      <div data-theme="atlvs-product" className="page-shell">
        <div className="mx-auto max-w-5xl px-6 pt-5">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-[var(--foreground)]"
              aria-label={brandAria}
            >
              {tenant.branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.branding.logoUrl} alt="" className="h-5 w-auto" />
              ) : null}
              <span className={isDefaultBrand ? "tracking-[0.14em] uppercase" : ""}>{brandName}</span>
            </Link>
            <ThemeToggle />
          </div>
          <nav className="mt-4 flex flex-wrap gap-1 border-b border-[var(--border-color)] pb-2">
            {tabs.map((tab) => (
              <Link key={tab.href} href={tab.href} className="nav-item text-sm">
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
        <main className="animate-page-enter mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </TenantShell>
  );
}
