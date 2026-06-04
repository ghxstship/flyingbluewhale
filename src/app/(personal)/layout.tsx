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
  // ADR-0010 Move 2: three-area grouping. Account = identity + access.
  // Activity = events happening to me. Marketplace = discovery + participation.
  // Same horizontal tab pattern; just rendered in 3 visually-separated
  // sections so users stop scanning a 17-leaf flat list. URLs unchanged.
  const tabGroups = [
    {
      label: t("me.layout.groups.account", undefined, "Account"),
      tabs: [
        { label: t("me.layout.tabs.profile", undefined, "Profile"), href: "/me/profile" },
        { label: t("me.layout.tabs.preferences", undefined, "Preferences"), href: "/me/preferences" },
        { label: t("me.layout.tabs.settings", undefined, "Settings"), href: "/me/settings" },
        { label: t("me.layout.tabs.privacy", undefined, "Privacy"), href: "/me/privacy" },
        { label: t("me.layout.tabs.security", undefined, "Security"), href: "/me/security" },
        { label: t("me.layout.tabs.organizations", undefined, "Organizations"), href: "/me/organizations" },
      ],
    },
    {
      label: t("me.layout.groups.activity", undefined, "Activity"),
      tabs: [
        { label: t("me.layout.tabs.dashboard", undefined, "Dashboard"), href: "/me" },
        { label: t("me.layout.tabs.notifications", undefined, "Notifications"), href: "/me/notifications" },
        { label: t("me.layout.tabs.tickets", undefined, "Tickets"), href: "/me/tickets" },
        { label: t("me.layout.tabs.reviews", undefined, "Reviews"), href: "/me/reviews" },
      ],
    },
    {
      label: t("me.layout.groups.marketplace", undefined, "Marketplace"),
      tabs: [
        { label: t("me.layout.tabs.talent", undefined, "Talent"), href: "/me/talent" },
        { label: t("me.layout.tabs.applications", undefined, "Applications"), href: "/me/applications" },
        { label: t("me.layout.tabs.submissions", undefined, "Submissions"), href: "/me/submissions" },
        { label: t("me.layout.tabs.offers", undefined, "Offers"), href: "/me/offers" },
        { label: t("me.layout.tabs.availability", undefined, "Availability"), href: "/me/availability" },
        { label: t("me.layout.tabs.savedSearches", undefined, "Saved Searches"), href: "/me/saved-searches" },
        { label: t("me.layout.tabs.crew", undefined, "Crew"), href: "/me/crew" },
      ],
    },
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
          {/* ADR-0010 three-area nav: section labels render as quiet
              eyebrows over each tab group; tabs themselves keep the
              same `.nav-item` chrome the flat list used. */}
          <nav className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--border-color)] pb-2">
            {tabGroups.map((group, i) => (
              <div key={group.label} className="flex flex-wrap items-center gap-1">
                {i > 0 ? (
                  <span aria-hidden="true" className="text-[var(--text-muted)]">
                    ·
                  </span>
                ) : null}
                <span className="me-0.5 text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
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
        <main className="animate-page-enter mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </TenantShell>
  );
}
