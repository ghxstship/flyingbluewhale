/**
 * Content-Security-Policy builder shared by `src/proxy.ts` (per-request,
 * nonce-aware, applied to HTML document responses) and used as the single
 * source of truth for the policy's directive list.
 *
 * Why per-request: the document CSP carries a per-navigation `nonce` so the
 * two inline bootstrap scripts in `app/layout.tsx` (theme + service-worker
 * registration) can execute under `script-src 'nonce-<n>'` WITHOUT the blanket
 * `'unsafe-inline'` that defeats CSP's XSS defense. A static header (as in
 * next.config.ts `headers()`) can't mint a fresh nonce per request, so the
 * HTML policy must be emitted from middleware. Non-document responses still
 * get a static, nonce-free policy from next.config.ts.
 *
 * `unsafe-eval` is only needed by Turbopack's dev HMR runtime; production
 * Next.js (App Router + RSC) does not require it. In dev we also keep
 * `'unsafe-inline'` because Next's dev server injects un-nonced inline
 * scripts (HMR, error overlay) that would otherwise be blocked.
 */

export const NONCE_HEADER = "x-nonce";

function supabaseHostname(): string {
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
    }
  } catch {}
  return "*.supabase.co";
}

/**
 * Generate a base64 nonce using the Web Crypto API (available in the Edge
 * runtime where `src/proxy.ts` runs — no `node:crypto` import).
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // btoa over a binary string — Edge runtime provides btoa globally.
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/**
 * Build the document Content-Security-Policy.
 *
 * @param nonce  per-request nonce; when provided (production HTML responses)
 *               `script-src` allows `'nonce-<n>'` and DROPS `'unsafe-inline'`.
 * @param isDev  when true, `script-src` keeps `'unsafe-inline' 'unsafe-eval'`
 *               for the Next dev server's un-nonced HMR/overlay scripts.
 */
export function buildCsp(opts: { nonce?: string; isDev: boolean }): string {
  const { nonce, isDev } = opts;
  const supabaseHost = supabaseHostname();

  // In production with a nonce we drop 'unsafe-inline' entirely — the nonce is
  // the only inline-script gate. In dev we keep the unsafe directives so the
  // dev server's injected scripts run. (A nonce + 'unsafe-inline' together is
  // valid CSP: browsers that honor the nonce ignore 'unsafe-inline', so dev
  // stays permissive while the directive list shape is identical to prod.)
  const scriptSrc = isDev
    ? `'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com`
    : `'self' ${nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"} https://js.stripe.com`;

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https://${supabaseHost} https://*.stripe.com`,
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.anthropic.com https://api.stripe.com https://*.ingest.sentry.io`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
    `frame-ancestors 'self'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
  ].join("; ");
}
