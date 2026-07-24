"use client";

import { Button } from "@/components/ui/Button";

/** Print / save-as-PDF trigger for the certificate artifact (audit D-28). */
export function PrintButton({ label }: { label: string }) {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
