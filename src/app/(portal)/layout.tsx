export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div data-platform="gvteway" className="page-shell">{children}</div>;
}
