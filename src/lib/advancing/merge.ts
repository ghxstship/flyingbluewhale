/**
 * Advance merge grammar (kit 27, plan §04).
 *
 * Subject and body use the established campaign convention verbatim:
 *   {emoji} | {ProjectCode} Advance | {Team} · {Company}
 * e.g. "MochakkCalling_050925 Advance | Lasers · LaserNet" — the emoji
 * prefix appears only when the packet voice is not neutral (decision #3).
 *
 * Merge fields are dotted paths resolved from a flat context built at send
 * time; the resolved values are frozen onto each recipient's
 * `render_snapshot` for auditability.
 *
 * Pure module: consumed by the merge console preview, the send action, and
 * tests.
 */

export const MERGE_FIELDS = [
  { path: "project.name", label: "Project Name" },
  { path: "project.code", label: "Project Code" },
  { path: "project.venue", label: "Venue" },
  { path: "audience.team", label: "Team" },
  { path: "audience.company", label: "Company" },
  { path: "recipient.name", label: "Recipient Name" },
  { path: "recipient.contractId", label: "Contract ID" },
  { path: "deadline.advance", label: "Advance Deadline" },
  { path: "links.portal", label: "Portal Link" },
  { path: "support.owner", label: "Support Contact" },
] as const;

export type MergeContext = Record<string, string>;

const MERGE_TOKEN_RE = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

/** Replace {{dotted.path}} tokens from the context; unknown tokens resolve to "". */
export function renderMergeString(template: string, ctx: MergeContext): string {
  return template.replace(MERGE_TOKEN_RE, (_, path: string) => ctx[path] ?? "");
}

export function buildMergeContext(input: {
  projectName: string;
  projectCode?: string | null;
  venue?: string | null;
  team?: string | null;
  company: string;
  recipientName?: string | null;
  contractId?: string | null;
  deadline?: string | null;
  portalUrl: string;
  supportOwner?: string | null;
}): MergeContext {
  return {
    "project.name": input.projectName,
    "project.code": input.projectCode ?? input.projectName.replace(/\s+/g, ""),
    "project.venue": input.venue ?? "",
    "audience.team": input.team ?? "",
    "audience.company": input.company,
    "recipient.name": input.recipientName ?? "",
    "recipient.contractId": input.contractId ?? "",
    "deadline.advance": input.deadline ?? "",
    "links.portal": input.portalUrl,
    "support.owner": input.supportOwner ?? "",
  };
}

/**
 * The canonical advance subject line. Team and company degrade gracefully
 * when an audience carries only one of them; the emoji prefix is
 * voice-gated (neutral default, per-project flair opt-in).
 */
export function advanceSubject(input: {
  projectCode: string;
  team?: string | null;
  company: string;
  voice?: string | null;
}): string {
  const audience = input.team ? `${input.team} · ${input.company}` : input.company;
  const base = `${input.projectCode} Advance | ${audience}`;
  return input.voice && input.voice !== "neutral" ? `🛩️ | ${base}` : base;
}
