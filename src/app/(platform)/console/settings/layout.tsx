import { SettingsSidebar } from "./SettingsSidebar";

/**
 * Settings is admin, not everyday work — it gets its own 2-col area separate
 * from the primary console sidebar. See `docs/ia/03-ia-compression-proposal.md`.
 * The primary sidebar stays mounted via `(platform)/layout.tsx`; this layout
 * only shapes the inner content.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col gap-0 lg:flex-row">
      <SettingsSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
