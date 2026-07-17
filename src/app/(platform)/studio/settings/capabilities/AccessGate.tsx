import { ShieldOff } from "lucide-react";

/**
 * The refusal panel for the capabilities admin surfaces.
 *
 * Nav hides these entries below the manager band (minRole), but a nav
 * gate is a curtain, not a wall — the deployed-target e2e walked a
 * member straight to the URL and the page rendered the whole grant
 * configuration. Reads here reveal who holds which capability across
 * the org, which is manager-band information (the RLS on the grant
 * tables agrees; the page must too).
 */
export function AccessGate({ need }: { need: string }) {
  return (
    <div className="surface mx-auto mt-16 max-w-md p-8 text-center">
      <ShieldOff size={28} className="mx-auto text-[var(--p-text-3)]" aria-hidden="true" />
      <h1 className="mt-4 text-lg font-semibold">Not authorized</h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        Capability administration needs the {need} band. If you think you should have access, ask an org admin.
      </p>
    </div>
  );
}
