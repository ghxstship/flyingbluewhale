// Shared option tuples for the AI Field Agents console module. Kept in a
// plain module (NOT the "use server" actions file, which may only export
// async functions) so both the form and the server actions can import them.

/** Output schemas the executor (`runFieldAgent`) supports. */
export const AGENT_OUTPUT_TYPES = ["text", "number", "select"] as const;
export type AgentOutputType = (typeof AGENT_OUTPUT_TYPES)[number];

/**
 * Tables an agent may target. Mirrors the `ALLOWED_TABLES` whitelist in
 * `src/lib/ai/agents.ts` — keep the two in sync so the UI never offers a
 * target the executor would reject at runtime.
 */
export const AGENT_TARGET_TABLES = ["incidents", "tickets", "tasks", "deliverables", "leads"] as const;
export type AgentTargetTable = (typeof AGENT_TARGET_TABLES)[number];
