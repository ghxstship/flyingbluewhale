'use client';
export default function ScanPage() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-64 h-64 border-2 border-dashed border-border rounded-2xl flex items-center justify-center mb-4">
        <span className="text-4xl">📷</span>
      </div>
      <h1 className="text-heading text-lg text-text-primary mb-1">Scan QR Code</h1>
      <p className="text-text-secondary text-sm">Point camera at ticket or credential QR code</p>
    </div>
  );
}
