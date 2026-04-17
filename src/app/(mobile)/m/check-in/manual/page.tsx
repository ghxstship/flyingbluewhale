import Link from "next/link";
import { CheckInScanner } from "../CheckInScanner";

export const dynamic = "force-dynamic";

export default function ManualLookupPage() {
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">Manual lookup</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Type a ticket code when the QR is unreadable</p>
      <div className="mt-6"><CheckInScanner /></div>
      <div className="mt-4 text-center">
        <Link href="/m/check-in" className="text-xs text-[var(--org-primary)]">Back to scanner →</Link>
      </div>
    </div>
  );
}
