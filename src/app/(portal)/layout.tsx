export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-platform="gvteway" className="page-shell">
      <main id="main" className="contents">
        {children}
      </main>
    </div>
  );
}
