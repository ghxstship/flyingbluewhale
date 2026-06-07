#!/usr/bin/env bash
# Bulk-migrate every legacy CSS var reference in src/ to the kit's --p-* namespace.
# Uses perl (universally available on macOS) for proper \b word-boundary handling
# — BSD sed does NOT support \b and silently no-ops it.
set -euo pipefail
cd /Users/julianclarkson/Documents/flyingbluewhale

# Order matters: do compound names BEFORE their prefixes so e.g. --bg-secondary
# is rewritten before --bg. Perl \b treats `-` as a non-word char so
# `--bg\b` correctly matches the boundary between "g" and "-" in "--bg-secondary"
# — that's WHY ordering matters.
declare -a MAP=(
  # Surfaces / backgrounds
  '--bg-primary => --p-bg'
  '--bg-inset => --p-surface-2'
  '--bg-secondary => --p-surface'
  '--bg-tertiary => --p-surface-2'
  '--background => --p-bg'
  '--bg => --p-bg'
  '--surface-inset => --p-surface-2'
  '--surface-raised => --p-surface'
  '--surface-2 => --p-surface-2'
  '--surface-base => --p-bg'
  '--surface => --p-surface'
  # Borders
  '--border-color => --p-border'
  '--border-width-chrome => --p-border-width'
  '--border-width => --p-border-width'
  '--border => --p-border'
  # Text
  '--text-primary => --p-text-1'
  '--text-secondary => --p-text-2'
  '--text-color => --p-text-1'
  '--text-muted => --p-text-2'
  '--text-subtle => --p-text-3'
  '--foreground => --p-text-1'
  '--text => --p-text-1'
  # Accents
  '--accent-contrast => --p-accent-contrast'
  '--accent-solid => --p-accent'
  '--accent => --p-accent'
  '--org-on-primary => --p-accent-contrast'
  '--org-primary => --p-accent'
  '--org-secondary => --p-accent-hover'
  '--org-accent => --p-accent-text'
  # Semantic
  '--color-success => --p-success'
  '--color-warning => --p-warning'
  '--color-danger => --p-danger'
  '--color-error => --p-danger'
  '--color-info => --p-info'
  # Radii
  '--radius-sm => --p-r-sm'
  '--radius-md => --p-r'
  '--radius-lg => --p-r-lg'
  # Shadows
  '--shadow-elev-hover => --p-elev-2'
  '--shadow-elev-soft => --p-shadow-sm'
  '--shadow-card-hover => --p-elev-2'
  '--shadow-elev => --p-elev-1'
  '--shadow-press => --p-shadow-sm'
  '--shadow-1 => --p-elev-1'
  '--shadow-2 => --p-elev-2'
  '--shadow-3 => --p-elev-3'
  '--shadow-4 => --p-elev-3'
  # Ring
  '--ring-color => --p-accent'
)

# Find target files. Exclude:
#   - database.types.ts (generated)
#   - src/app/theme/*    (theme definitions own their own vars)
#   - src/app/globals.css (handled separately — has legacy :root vars to strip)
# macOS bash 3.2 doesn't have `mapfile` — pass the find output through xargs.
TARGETS_LIST=$(find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) \
  -not -path "*/database.types.ts" \
  -not -path "src/app/theme/*" \
  -not -path "src/app/globals.css")

COUNT=$(echo "$TARGETS_LIST" | wc -l | tr -d ' ')
echo "Sweeping $COUNT files..."

for entry in "${MAP[@]}"; do
  from="${entry%% => *}"
  to="${entry##* => }"
  # Perl \b treats `-` as a word boundary, so `--bg\b` would (wrongly) match
  # `--bg` inside `--bg-secondary`. Use a negative lookahead instead — any
  # CSS identifier continuation char (letter, digit, `_`, `-`) blocks the match.
  # \Q…\E literalizes the leading `--`. This is why MAP ordering still matters:
  # compound forms run before their prefixes so the lookahead has nothing to
  # block against.
  echo "$TARGETS_LIST" | xargs perl -pi -e "s/\Q${from}\E(?![-A-Za-z0-9_])/${to}/g"
done

echo "DONE: $COUNT files"
