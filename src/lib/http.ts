/**
 * IK-033 / IK-034 / IK-035 — hardened HTTP client.
 *
 * Wraps `fetch` with:
 *   - default 5s timeout (AbortSignal.timeout)
 *   - exponential-backoff retry for idempotent reads (GET/HEAD) on 429/5xx/network
 *   - per-host circuit breaker (half-open after 30s)
 *
 * Use everywhere except:
 *   - streaming responses where abort is controlled by UI (AssistantChat)
 *   - Supabase client (has its own retry layer)
 */

export type HttpOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  retryOn?: (status: number) => boolean;
};

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRIES = 2;
const CIRCUIT_OPEN_MS = 30_000;
const CIRCUIT_THRESHOLD = 5;

type HostState = { failures: number; openedAt: number | null };
const circuits = new Map<string, HostState>();

function getCircuit(host: string): HostState {
  if (!circuits.has(host)) circuits.set(host, { failures: 0, openedAt: null });
  return circuits.get(host)!;
}

function circuitOpen(host: string): boolean {
  const c = getCircuit(host);
  if (c.openedAt == null) return false;
  if (Date.now() - c.openedAt > CIRCUIT_OPEN_MS) {
    // Half-open — allow one request through; it either resets or re-opens.
    c.openedAt = null;
    c.failures = CIRCUIT_THRESHOLD - 1;
    return false;
  }
  return true;
}

function recordSuccess(host: string) {
  const c = getCircuit(host);
  c.failures = 0;
  c.openedAt = null;
}

function recordFailure(host: string) {
  const c = getCircuit(host);
  c.failures += 1;
  if (c.failures >= CIRCUIT_THRESHOLD) c.openedAt = Date.now();
}

export class CircuitOpenError extends Error {
  constructor(host: string) {
    super(`Circuit breaker open for ${host}`);
    this.name = "CircuitOpenError";
  }
}

export async function httpFetch(input: string | URL, init: HttpOptions = {}): Promise<Response> {
  const url = typeof input === "string" ? new URL(input) : input;
  const host = url.host;
  const method = (init.method ?? "GET").toUpperCase();
  const idempotent = method === "GET" || method === "HEAD";
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT;
  const retries = init.retries ?? (idempotent ? DEFAULT_RETRIES : 0);
  const retryOn = init.retryOn ?? defaultRetryOn;

  if (circuitOpen(host)) {
    throw new CircuitOpenError(host);
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { timeoutMs: _t, retries: _r, retryOn: _ro, signal: userSignal, ...rest } = init;
    void _t; void _r; void _ro;
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = userSignal ? combineSignals(userSignal, timeoutSignal) : timeoutSignal;

    try {
      const resp = await fetch(input, { ...rest, signal });
      if (retryOn(resp.status) && attempt < retries) {
        await backoff(attempt);
        continue;
      }
      if (resp.ok) recordSuccess(host);
      else if (resp.status >= 500) recordFailure(host);
      return resp;
    } catch (err) {
      lastErr = err;
      recordFailure(host);
      if (attempt >= retries) break;
      await backoff(attempt);
    }
  }
  throw lastErr;
}

function defaultRetryOn(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

function backoff(attempt: number): Promise<void> {
  const base = 200 * Math.pow(2, attempt); // 200, 400, 800
  const jitter = Math.random() * 100;
  return new Promise((r) => setTimeout(r, base + jitter));
}

function combineSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const ctl = new AbortController();
  const onAbort = () => ctl.abort();
  a.addEventListener("abort", onAbort);
  b.addEventListener("abort", onAbort);
  if (a.aborted || b.aborted) ctl.abort();
  return ctl.signal;
}
