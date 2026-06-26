#!/usr/bin/env bash
# Production go-live smoke test (LAUNCH_RUNBOOK §2.4).
#
# Runs against the DEPLOYED environment — the automatable half of the prod-env
# gate: domain routing, security headers, CSP (nonce, no unsafe-inline), API
# cache semantics, and health endpoints. The interactive half (auth email,
# Stripe webhook, push delivery) is listed at the end as manual checks.
#
# Usage:
#   bash scripts/prod-smoke.sh                      # defaults to https://atlvs.pro
#   BASE=https://atlvs.pro bash scripts/prod-smoke.sh
#   BASE=https://<preview>.vercel.app bash scripts/prod-smoke.sh   # path-prefix preview mode
#
# Subdomain hosts are derived from the apex unless the deploy is a single-host
# preview (no subdomains) — pass SUBDOMAINS=0 to skip the per-shell host checks.
set -uo pipefail

BASE="${BASE:-https://atlvs.pro}"
SUBDOMAINS="${SUBDOMAINS:-1}"
APEX_HOST="$(printf '%s' "$BASE" | sed -E 's#^https?://##; s#/.*$##')"
PASS=0; FAIL=0; WARN=0
ok()   { printf '  \033[32mPASS\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
warn() { printf '  \033[33mWARN\033[0m %s\n' "$1"; WARN=$((WARN+1)); }

# headers <url> -> stdout (lowercased header block), sets $STATUS
hdrs() { curl -sS -D - -o /dev/null -m 25 -A "atlvs-prod-smoke" "$1" 2>/dev/null | tr -d '\r'; }
status_of() { curl -sS -o /dev/null -m 25 -w '%{http_code}' -A "atlvs-prod-smoke" "$1" 2>/dev/null; }

echo "== ATLVS prod smoke =="
echo "base: $BASE   apex: $APEX_HOST   subdomains: $SUBDOMAINS"
echo

echo "[1] Reachability + routing"
ROOT_STATUS="$(status_of "$BASE/")"
case "$ROOT_STATUS" in 200|301|302|307|308) ok "apex / -> $ROOT_STATUS" ;; *) bad "apex / -> $ROOT_STATUS (expected 2xx/3xx)" ;; esac
MKT_STATUS="$(status_of "$BASE/marketplace")"
case "$MKT_STATUS" in 200|301|302|307|308) ok "/marketplace (anon public) -> $MKT_STATUS" ;; *) bad "/marketplace -> $MKT_STATUS" ;; esac
if [ "$SUBDOMAINS" = "1" ] && printf '%s' "$APEX_HOST" | grep -q '\.'; then
  ROOTDOMAIN="$(printf '%s' "$APEX_HOST" | sed -E 's#^(www|app|gvteway|compvss)\.##')"
  for sub in app gvteway compvss; do
    s="$(status_of "https://$sub.$ROOTDOMAIN/")"
    case "$s" in 200|301|302|307|308|401|403) ok "$sub.$ROOTDOMAIN / -> $s (routed)" ;; 000) bad "$sub.$ROOTDOMAIN / -> no response (DNS/cert?)" ;; 404) bad "$sub.$ROOTDOMAIN / -> 404 (host-rewrite not applied?)" ;; *) warn "$sub.$ROOTDOMAIN / -> $s" ;; esac
  done
else
  warn "subdomain checks skipped (single-host/preview or SUBDOMAINS=0)"
fi
echo

echo "[2] Security headers (apex document)"
H="$(hdrs "$BASE/")"
chk_h() { if printf '%s' "$H" | grep -qi "^$1:"; then ok "$1 present"; else bad "$1 missing"; fi; }
chk_h "strict-transport-security"
chk_h "x-content-type-options"
chk_h "referrer-policy"
chk_h "permissions-policy"
chk_h "content-security-policy"
printf '%s' "$H" | grep -qi '^x-content-type-options:.*nosniff' && ok "x-content-type-options = nosniff" || bad "x-content-type-options != nosniff"
if printf '%s' "$H" | grep -qiE '^(content-security-policy):.*frame-ancestors' || printf '%s' "$H" | grep -qi '^x-frame-options:'; then ok "clickjacking guard (frame-ancestors / X-Frame-Options)"; else bad "no frame-ancestors / X-Frame-Options"; fi
echo

echo "[3] CSP hardening (nonce, no unsafe-inline in script-src)"
CSP="$(printf '%s' "$H" | grep -i '^content-security-policy:' | head -1)"
if [ -z "$CSP" ]; then bad "no CSP header to inspect"; else
  SCRIPT_SRC="$(printf '%s' "$CSP" | tr ';' '\n' | grep -i 'script-src' || true)"
  if printf '%s' "$SCRIPT_SRC" | grep -qi "'nonce-"; then ok "script-src carries a per-request nonce"; else warn "script-src has no nonce (static fallback CSP served?)"; fi
  if printf '%s' "$SCRIPT_SRC" | grep -qi "'unsafe-inline'"; then bad "script-src still allows 'unsafe-inline' in prod"; else ok "script-src has no 'unsafe-inline'"; fi
fi
echo

echo "[4] API cache semantics"
AH="$(hdrs "$BASE/api/v1/health")"
if printf '%s' "$AH" | grep -qi '^cache-control:.*no-store'; then ok "/api/* Cache-Control: no-store"; else warn "/api/v1/health missing no-store (or endpoint differs)"; fi
echo

echo "[5] Health endpoints"
for ep in /api/v1/health /api/v1/health/readiness /api/v1/health/liveness; do
  s="$(status_of "$BASE$ep")"
  case "$s" in 200) ok "$ep -> 200" ;; 503) warn "$ep -> 503 (a dependency is down — inspect body)" ;; 404) warn "$ep -> 404 (path differs? check src/app/api/v1/health)" ;; *) warn "$ep -> $s" ;; esac
done
echo

echo "[6] Manual checks (not automatable here — verify by hand)"
cat <<'MANUAL'
  [ ] Auth email: real signup -> verification email arrives -> verify; password reset; invite accept
  [ ] Stripe: live/test checkout -> subscriptions.state updates from webhook (C1); credit purchase -> single credit_ledger grant (C2); Connect onboarding
  [ ] Push: VAPID set -> a notification delivers to a subscribed device
  [ ] Sentry: trigger a client error -> readable (un-minified) stack in the atlvs project (needs §2.2 Vercel vars)
  [ ] Cron (after ~24h): SELECT * FROM private.cron_run_log ORDER BY ran_at DESC  -> redaction + purge ran, no succeeded=false
MANUAL
echo

echo "== summary: $PASS pass / $WARN warn / $FAIL fail =="
[ "$FAIL" -eq 0 ]
