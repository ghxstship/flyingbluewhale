/**
 * The API scope vocabulary — the list that did not exist.
 *
 * `POST /api/v1/me/api-keys` accepted `scopes: z.array(z.string().max(64))`,
 * so any string minted successfully. A typo (`documnets:read`, `time:reed`)
 * produced a token that authenticated fine and silently granted nothing,
 * and the integrator had no way to discover why until a call 403'd. Scopes
 * were defined implicitly by whatever `assertScope` call sites happened to
 * exist.
 *
 * Deliberately dependency-free (no "server-only") so the mint route, the
 * docs, and tests all read the same list.
 *
 * Naming: `<domain>:<action>`. `assertScope` also honours a `<domain>:*`
 * grant, so `time:*` permits `time:read` — the wildcards below are real,
 * grantable scopes, not just documentation.
 */

/**
 * Every scope a token may be minted with. Sourced from the `assertScope` /
 * `assertCapability` call sites that actually gate routes — a scope nothing
 * checks is a promise the API doesn't keep, so this list is not aspirational.
 */
export const API_SCOPES = [
  // Wildcard — full access. Explicit here so granting it is a deliberate
  // act rather than the accident of leaving `scopes` empty.
  "*",

  // Projects & work
  "projects:read",
  "projects:write",
  "projects:*",
  "tasks:read",
  "tasks:write",
  "tasks:*",
  "schedule:*",
  "crew:read",
  "crew:*",

  // Time & pay. `time:approve` is a supervisory act and is NOT implied by
  // `time:write`; `payroll:export` is separate from `payroll:read` because
  // reading hours and sending them to a payroll provider are different
  // blast radii.
  "time:read",
  "time:write",
  "time:approve",
  "time:edit",
  "time:*",
  "timesheets:read",
  "timesheets:write",
  "timesheets:*",
  "payroll:read",
  "payroll:post",
  "payroll:export",
  "payroll:*",

  // Advancing & assignments
  "advancing:read",
  "advancing:write",
  "advancing:*",
  "assignments:read",
  "deliverables:read",

  // Finance
  "invoices:read",
  "invoices:write",
  "invoices:*",
  "expenses:read",
  "expenses:*",
  "budgets:read",
  "procurement:read",
  "procurement:*",
  "payouts:write",
  "billing:write",

  // Sales
  "clients:read",
  "clients:*",
  "proposals:read",
  "proposals:approve",
  "proposals:*",

  // Docs, reports, ops
  "documents:read",
  "documents:write",
  "documents:*",
  "reports:read",
  "handovers:read",
  "handovers:write",
  "marketplace:read",
  "marketplace:write",
  "mileage:*",
  "check-in:write",
  "check-in:*",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

const SCOPE_SET: ReadonlySet<string> = new Set(API_SCOPES);

export function isApiScope(scope: string): scope is ApiScope {
  return SCOPE_SET.has(scope);
}

/**
 * Suggest the closest real scope for a rejected one, so an integrator who
 * typed `time:reed` is told what they meant instead of just "invalid".
 */
export function suggestScope(input: string): ApiScope | null {
  const lower = input.toLowerCase().trim();
  let best: ApiScope | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const scope of API_SCOPES) {
    const d = editDistance(lower, scope);
    if (d < bestDistance) {
      bestDistance = d;
      best = scope;
    }
  }
  // Only suggest a genuinely near miss; an unrelated string gets no hint.
  return bestDistance <= 3 ? best : null;
}

function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  let prev = Array.from({ length: cols }, (_, j) => j);
  for (let i = 1; i < rows; i++) {
    const cur = [i, ...Array<number>(cols - 1).fill(0)];
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min((cur[j - 1] ?? 0) + 1, (prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    prev = cur;
  }
  return prev[cols - 1] ?? Number.POSITIVE_INFINITY;
}

/**
 * Scopes the mint UI offers as a sensible read-only starting point — what
 * an analytics or reporting integration needs and nothing more.
 */
export const READ_ONLY_SCOPE_PRESET: readonly ApiScope[] = [
  "projects:read",
  "tasks:read",
  "time:read",
  "timesheets:read",
  "payroll:read",
  "invoices:read",
  "reports:read",
];
