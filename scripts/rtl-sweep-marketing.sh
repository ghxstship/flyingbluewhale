#!/usr/bin/env bash
# RTL physical → logical utility sweep over src/app/(marketing).
#
# Same patterns as the earlier sweep (commit 6df29c4b) but scoped to
# the marketing shell, which was held back during the initial pass
# because the Phase 1b workflow was editing those files concurrently.
#
# Run this AFTER Phase 1b reports complete and you've committed its
# changes. Keeps text-right untouched (numeric column convention).

set -e

if ! command -v perl >/dev/null 2>&1; then
  echo "perl required" >&2
  exit 1
fi

DIRS=(
  "src/app/(marketing)"
)

FILES=$(find "${DIRS[@]}" -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) 2>/dev/null)
COUNT=$(echo "$FILES" | grep -c .)
echo "Sweeping $COUNT files under (marketing)…"

perl -p -i -e '
  s/\b(-?)ml-(\d|auto|px|0\.5|1\.5|2\.5|3\.5|\[)/${1}ms-${2}/g;
  s/\b(-?)mr-(\d|auto|px|0\.5|1\.5|2\.5|3\.5|\[)/${1}me-${2}/g;
  s/\bpl-(\d|px|0\.5|1\.5|2\.5|3\.5|\[)/ps-${1}/g;
  s/\bpr-(\d|px|0\.5|1\.5|2\.5|3\.5|\[)/pe-${1}/g;
  s/\btext-left\b/text-start/g;
  s/\bborder-l\b/border-s/g;
  s/\bborder-r\b/border-e/g;
  s/\bborder-l-(\d+|none)\b/border-s-${1}/g;
  s/\bborder-r-(\d+|none)\b/border-e-${1}/g;
  s/\brounded-l\b/rounded-s/g;
  s/\brounded-r\b/rounded-e/g;
  s/\brounded-l-(\w+)\b/rounded-s-${1}/g;
  s/\brounded-r-(\w+)\b/rounded-e-${1}/g;
  s/\b(-?)left-(\d+|px|0\.5|1\.5|2\.5|3\.5|\[)(?!\/)/${1}start-${2}/g;
  s/\b(-?)right-(\d+|px|0\.5|1\.5|2\.5|3\.5|\[)(?!\/)/${1}end-${2}/g;
  s/\b(-?)left-\[/${1}start-\[/g;
  s/\b(-?)right-\[/${1}end-\[/g;
' $FILES

echo "Remaining physical utilities under (marketing):"
for pat in '\bml-[0-9]' '\bmr-[0-9]' '\bpl-[0-9]' '\bpr-[0-9]' 'text-left' 'border-l-' 'border-r-'; do
  count=$(grep -rE "$pat" "${DIRS[@]}" --include='*.tsx' --include='*.ts' --include='*.css' 2>/dev/null | wc -l | tr -d ' ')
  printf "  %-15s %s\n" "$pat" "$count"
done
