import "server-only";

/**
 * Console record-ref resolution now lives in the shared SSOT
 * `src/lib/chat/record-refs.ts` (kit 21 remediation R1, ADR-0015) so every
 * shell resolves the same way and only the destination href differs. This
 * re-export keeps the console callers stable; pass shell="platform".
 */
export { resolveRecordRefs, recordHref, type RecordRef, type RecordRefMap } from "@/lib/chat/record-refs";
