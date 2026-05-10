export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <main id="main">{children}</main>
    </div>
  );
}
