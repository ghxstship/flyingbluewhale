export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="main" data-platform="gvteway" className="page-shell">
      {children}
    </div>
  );
}
