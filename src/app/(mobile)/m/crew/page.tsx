import Link from "next/link";

export default function CrewHome() {
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">Today</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Your call sheet and clock controls</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link href="/m/crew/clock" className="surface-raised p-4"><div className="text-sm font-semibold">Clock</div><div className="mt-1 text-xs text-[var(--text-muted)]">In / out</div></Link>
        <Link href="/m/tasks" className="surface-raised p-4"><div className="text-sm font-semibold">Tasks</div><div className="mt-1 text-xs text-[var(--text-muted)]">Today</div></Link>
      </div>
    </div>
  );
}
