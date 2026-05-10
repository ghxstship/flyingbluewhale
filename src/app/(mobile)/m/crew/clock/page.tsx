import { ClockInOut } from "./ClockInOut";
import { getOpenShiftAction } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Field-shell clock page. Resolves the user's currently-open shift
 * (if any) on the server so a refresh restores the running timer
 * instead of dropping the user back to "ready to start".
 */
export default async function ClockPage() {
  const initial = await getOpenShiftAction();
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">Clock</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Geo-verified time tracking</p>
      <div className="mt-6">
        <ClockInOut initial={initial} />
      </div>
    </div>
  );
}
