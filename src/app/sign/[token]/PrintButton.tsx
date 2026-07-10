"use client";

import { Button } from "@/components/ui/Button";

/** Print / save-as-PDF affordance for the signed-copy view (E-19). */
export function PrintButton({ label }: { label: string }) {
  return (
    <Button variant="secondary" onClick={() => window.print()} className="print:hidden">
      {label}
    </Button>
  );
}
