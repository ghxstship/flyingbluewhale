import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export default function MobileSettings() {
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">Settings</h1>
      <div className="mt-6 space-y-3">
        <div className="surface-raised p-4">
          <div className="text-sm font-semibold">Offline Mode</div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Service worker cache</span>
            <Badge variant="success">Ready</Badge>
          </div>
        </div>
        <div className="surface-raised p-4">
          <div className="text-sm font-semibold">Camera</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">Required for scan + incident reports.</div>
        </div>
        <div className="surface-raised p-4">
          <div className="text-sm font-semibold">Location</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">Used for geo-verified clock in/out.</div>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn btn-ghost w-full">
            Sign Out
          </button>
        </form>
        <div className="text-center text-[10px] text-[var(--text-muted)]">
          <Link href="/" className="font-medium text-[var(--text-muted)]">
            COMPVSS · v0.1
          </Link>
        </div>
      </div>
    </div>
  );
}
