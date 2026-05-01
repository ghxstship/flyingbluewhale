import { CheckInScanner } from "./CheckInScanner";

export const dynamic = "force-dynamic";

export default function CheckInHome() {
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-label text-[var(--brand-color)]">Field Check-In</div>
      <h1 className="text-display mt-2 text-3xl">Scan Tickets</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Camera-based QR/barcode scanning. Network-only — must be online to validate.
      </p>
      <div className="mt-6">
        <CheckInScanner />
      </div>
    </div>
  );
}
