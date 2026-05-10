import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TenantShell, resolveTenant } from "@/components/TenantShell";
import { requireSession } from "@/lib/auth";
import { PersonalTabs } from "./PersonalTabs";

export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
  // Outer auth guard — matches (platform) and (mobile) shell convention.
  // Previously `/me/*` pages rendered chrome + empty forms to anon visitors,
  // leaking shell structure and risking partial data exposure through any
  // client component that assumed a session existed. UJV cell R1-R10·S1/S3.
  await requireSession("/login");
  const tenant = await resolveTenant();
  const brandName = tenant.branding.productName ?? tenant.orgName ?? "L Y T E H A U S";
  const brandAria = tenant.branding.productName ?? tenant.orgName ?? "LYTEHAUS Technologies";
  const isDefaultBrand = !tenant.branding.productName && !tenant.orgName;
  return (
    <TenantShell tenant={tenant}>
      <div className="page-shell">
        <div className="mx-auto max-w-5xl px-6 pt-5">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-[var(--foreground)]"
              aria-label={`${brandAria} — home`}
            >
              {tenant.branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.branding.logoUrl} alt="" className="h-5 w-auto" />
              ) : null}
              <span className={isDefaultBrand ? "tracking-[0.14em] uppercase" : ""}>{brandName}</span>
            </Link>
            <ThemeToggle />
          </div>
          <PersonalTabs />
        </div>
        <main id="main" className="animate-page-enter mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </TenantShell>
  );
}
