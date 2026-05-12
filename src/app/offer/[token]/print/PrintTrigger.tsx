"use client";

export function PrintTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded border border-black bg-black px-3 py-1.5 text-xs text-white hover:opacity-80"
    >
      Print / Save as PDF
    </button>
  );
}
