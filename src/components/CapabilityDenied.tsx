import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Kit 30 — the capability-named lock screen (the "permission denied" state
 * of the five-state contract). Renders in place of a surface's body when
 * `can(session, capability)` fails, always naming the exact capability so
 * an operator knows what to ask their admin for. Composition over the
 * EmptyState kit primitive — not a new primitive.
 */
export function CapabilityDenied({ capability, title, description }: { capability: string; title: string; description: string }) {
  return (
    <div className="page-content">
      <EmptyState
        icon={<ShieldAlert size={32} />}
        title={title}
        description={description}
        action={
          <span className="text-xs text-[var(--p-text-2)]">
            <code className="rounded border border-[var(--p-border)] bg-[var(--p-surface)] px-1.5 py-0.5 font-mono text-[11px]">{capability}</code>
          </span>
        }
        secondaryAction={
          <Link href="/studio/settings/capabilities" className="text-xs underline">
            Settings · Capabilities
          </Link>
        }
      />
    </div>
  );
}
