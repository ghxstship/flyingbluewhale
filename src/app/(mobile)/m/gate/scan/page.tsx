import { GateScanner } from "./GateScanner";

export const dynamic = "force-dynamic";

export default function GateScanPage() {
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-label text-[var(--brand-color)]">Gate</div>
      <h1 className="text-display mt-2 text-3xl">Scan accreditation</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Scan a card barcode to grant or deny access. Decisions are recorded server-side with the scanner identity.
      </p>
      <div className="mt-6">
        <GateScanner />
      </div>
    </div>
  );
}
