import { CheckInScanner } from "../../CheckInScanner";

export const dynamic = "force-dynamic";

export default async function ScanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Scanning · {slug}</div>
      <h1 className="mt-1 text-2xl font-semibold">QR scan</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Paste the scanned code below — camera integration drops on mobile clients.</p>
      <div className="mt-6"><CheckInScanner /></div>
    </div>
  );
}
