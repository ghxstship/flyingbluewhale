#!/usr/bin/env bash
# Migrate legacy class names → kit .ps-* equivalents across JSX/TS.
set -euo pipefail
cd /Users/julianclarkson/Documents/flyingbluewhale

TARGETS_LIST=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/database.types.ts" \
  -not -path "*/design-system.test.ts" \
  -not -path "src/components/ui/Button.tsx")

COUNT=$(echo "$TARGETS_LIST" | wc -l | tr -d ' ')
echo "Migrating $COUNT files..."

# Note: every pattern uses negative lookbehind to skip matches that already
# carry the `ps-` prefix (so `ps-btn-primary` etc. aren't reprocessed).
echo "$TARGETS_LIST" | xargs perl -pi -e '
  # btn compound → ps-btn variants (LONGEST FIRST)
  s/(?<![-A-Za-z0-9_])btn btn-primary(?![-A-Za-z0-9_])/ps-btn/g;
  s/(?<![-A-Za-z0-9_])btn btn-secondary(?![-A-Za-z0-9_])/ps-btn ps-btn--ghost/g;
  s/(?<![-A-Za-z0-9_])btn btn-ghost(?![-A-Za-z0-9_])/ps-btn ps-btn--ghost/g;
  s/(?<![-A-Za-z0-9_])btn btn-danger(?![-A-Za-z0-9_])/ps-btn ps-btn--danger/g;

  # btn sizes (standalone)
  s/(?<![-A-Za-z0-9_])btn-sm(?![-A-Za-z0-9_])/ps-btn--sm/g;
  s/(?<![-A-Za-z0-9_])btn-lg(?![-A-Za-z0-9_])/ps-btn--lg/g;
  s/(?<![-A-Za-z0-9_])btn-icon(?![-A-Za-z0-9_])/ps-btn--icon/g;

  # btn variants (standalone, e.g. template literals like btn-${variant} produce btn-primary)
  s/(?<![-A-Za-z0-9_])btn-primary(?![-A-Za-z0-9_])/ps-btn/g;
  s/(?<![-A-Za-z0-9_])btn-secondary(?![-A-Za-z0-9_])/ps-btn ps-btn--ghost/g;
  s/(?<![-A-Za-z0-9_])btn-ghost(?![-A-Za-z0-9_])/ps-btn ps-btn--ghost/g;
  s/(?<![-A-Za-z0-9_])btn-danger(?![-A-Za-z0-9_])/ps-btn ps-btn--danger/g;

  # Bare btn → ps-btn (do this LAST so it does not eat the compounds above)
  s/(?<![-A-Za-z0-9_])btn(?![-A-Za-z0-9_])/ps-btn/g;

  # data-table → ps-table
  s/(?<![-A-Za-z0-9_])data-table(?![-A-Za-z0-9_])/ps-table/g;

  # status-dot variants → ps-dot
  s/(?<![-A-Za-z0-9_])status-dot-success(?![-A-Za-z0-9_])/ps-dot ps-dot--ok/g;
  s/(?<![-A-Za-z0-9_])status-dot-warning(?![-A-Za-z0-9_])/ps-dot ps-dot--warn/g;
  s/(?<![-A-Za-z0-9_])status-dot-error(?![-A-Za-z0-9_])/ps-dot ps-dot--danger/g;
  s/(?<![-A-Za-z0-9_])status-dot-neutral(?![-A-Za-z0-9_])/ps-dot ps-dot--muted/g;
  s/(?<![-A-Za-z0-9_])status-dot-pulse(?![-A-Za-z0-9_])/ps-dot/g;
  s/(?<![-A-Za-z0-9_])status-dot(?![-A-Za-z0-9_])/ps-dot/g;

  # skeleton → ps-skel
  s/(?<![-A-Za-z0-9_])skeleton(?![-A-Za-z0-9_])/ps-skel/g;
'

echo "DONE"
