/* ═══════════════════════════════════════════════════════
   Platform Layout
   Minimal wrapper for all (platform) routes.
   Ensures consistent background and page structure.
   ═══════════════════════════════════════════════════════ */

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
