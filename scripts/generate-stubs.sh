#!/usr/bin/env bash
# Generates stub page.tsx files for every route in the IA.
# Format per line: <relative_path_under_src/app>|<title>|<description>
# Lines starting with # or empty are skipped. Existing files are NOT overwritten.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/src/app"

write_stub() {
  local rel="$1" title="$2" desc="$3"
  local file="$APP/$rel"
  local dir
  dir="$(dirname "$file")"
  mkdir -p "$dir"
  if [[ -e "$file" ]]; then return 0; fi
  # PageStub was retired (audit 2026-06-09) — new stubs render a real,
  # if minimal, page so nothing ships a "scaffolded but not wired" wall.
  cat > "$file" <<EOF
import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader title="$title" subtitle="$desc" />
      <div className="page-content" />
    </>
  );
}
EOF
}

while IFS='|' read -r rel title desc; do
  [[ -z "${rel:-}" || "${rel:0:1}" == "#" ]] && continue
  write_stub "$rel" "$title" "$desc"
done < "$ROOT/scripts/routes.txt"

echo "Stubs generated."
