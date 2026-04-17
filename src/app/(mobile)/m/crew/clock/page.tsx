import { ClockInOut } from "./ClockInOut";

export const dynamic = "force-dynamic";

export default function ClockPage() {
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">Clock</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Geo-verified time tracking</p>
      <div className="mt-6"><ClockInOut /></div>
    </div>
  );
}
