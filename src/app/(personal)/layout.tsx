import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { requireSession } from "@/lib/auth";

const tabs = [
  { label: "Dashboard", href: "/me" },
  { label: "Profile", href: "/me/profile" },
  { label: "Appearance", href: "/me/settings/appearance" },
  { label: "Settings", href: "/me/settings" },
  { label: "Notifications", href: "/me/notifications" },
  { label: "Security", href: "/me/security" },
  { label: "Privacy", href: "/me/privacy" },
  { label: "Tickets", href: "/me/tickets" },
  { label: "Organizations", href: "/me/organizations" },
];

export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
  // Outer auth guard — matches (platform) and (mobile) shell convention.
  // Previously `/me/*` pages rendered chrome + empty forms to anon visitors,
  // leaking shell structure and risking partial data exposure through any
  // client component that assumed a session existed. UJV cell R1-R10·S1/S3.
  await requireSession("/login");
  const tenant = await resolveTenant();
  const brandName = tenant.branding.productName ?? tenant.orgName ?? "SECOND STVR";
  const brandAria = tenant.branding.productName ?? tenant.orgName ?? "Second Star Technologies";
  const isDefaultBrand = !tenant.branding.productName && !tenant.orgName;
  return (
    <TenantShell tenant={tenant}>
      <div className="page-shell">
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
              <span className={isDefaultBrand ? "tracking-[0.14em] uppercase" : ""}>
                {brandName}
              </span>
            </Link>
            <ThemeToggle />
          </div>
          <nav className="mt-4 flex flex-wrap gap-1 border-b border-[var(--border-color)] pb-2">
            {tabs.map((t) => (
              <Link key={t.href} href={t.href} className="nav-item text-sm">
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
        <main className="mx-auto max-w-5xl px-6 py-8 animate-page-enter">{children}</main>
      </div>
    </TenantShell>
  );
}
