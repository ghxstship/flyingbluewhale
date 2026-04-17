'use client';
export default function ClockPage() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-6xl mb-4">⏱️</div>
      <h1 className="text-heading text-lg text-text-primary mb-2">Clock In / Out</h1>
      <p className="text-text-secondary text-sm mb-6">Geo-verified time tracking</p>
      <button className="btn btn-primary w-full max-w-xs py-3 text-base">Clock In</button>
    </div>
  );
}
