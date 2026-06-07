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
      {children}
    </div>
  );
}
