import { ConnectivityBanner } from "@/components/ui/GlobalBanner";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  // Theme lock — per v2 GHXSTSHIP handoff: SaaS shells (portal included)
  // paint with the neutral atlvs-product skin, regardless of the user's
  // cookie pref for legacy cosmic skin on marketing.
  // data-platform="gvteway" narrows the accent to plasma cyan.
  return (
    <div
      data-ui="saas"
      data-theme="atlvs-product"
      data-product="gvteway"
      data-platform="gvteway"
      className="page-shell"
    >
      {/* On-site personas (crew, vendors, delegations) hit the portal from
          phones in venues with patchy coverage — same offline awareness the
          COMPVSS shell gets. Offline state persists; "back online" auto-hides. */}
      <ConnectivityBanner />
      {children}
    </div>
  );
}
