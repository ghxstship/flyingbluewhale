import { Badge } from "./Badge";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

/**
 * Domain-status badge — colors any lifecycle/state enum via the
 * canonical tone maps in `src/lib/tones.ts` (fulfillment_state,
 * generic document states, etc.). Unknown values render as "default".
 */
export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={toneFor(status)}>{toTitle(status)}</Badge>;
}
