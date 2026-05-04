#!/usr/bin/env python3
"""
Bulk-apply optimistic concurrency to all edit/actions.ts files in
src/app/(platform)/console.

Sea Trial FINDING-022 sweep — extends the concurrency helper that was
hand-applied to projects/events/clients/vendors to the remaining ~56
update endpoints.

For each `actions.ts` we:
1. Add `import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";`
2. Replace the `.update(PATCH).eq("id", id).eq("org_id", session.orgId)` shape with:
       const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
       const result = await updateOrgScopedWithCheck(TABLE, session.orgId, id, expectedUpdatedAt, PATCH);
       if (!result.ok) return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Not found." };

For each matching `page.tsx` we inject `<input type="hidden" name="_updated_at" defaultValue={row.updated_at} />`
right after the `<FormShell` opening tag.

The transformer is conservative: it skips any file it doesn't recognize
the shape of, prints a warning, and leaves the file untouched. Always
typecheck after running.
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path("src/app/(platform)/console")
HELPER_IMPORT = (
    'import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";'
)
HIDDEN_FIELD = '          {/* Sea Trial FINDING-022: optimistic concurrency token. */}\n          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />\n'

# Match: const { error } = await supabase
#          .from("TABLE")
#          .update({ ... PATCH ... })
#          .eq("id", id)
#          .eq("org_id", session.orgId);
#        if (error) return { error: error.message };
PATTERN = re.compile(
    r"""
    (?P<indent>[ \t]*)const\s+\{\s+error(\s*:\s*\w+)?\s+\}\s*=\s*await\s+supabase\s*
    \.from\(["'](?P<table>[a-z_]+)["']\)\s*
    \.update\((?P<patch>(?:[^()]|\([^()]*\))*)\)\s*
    \.eq\(["']id["']\s*,\s*(?P<id_var>[a-zA-Z_][\w.]*)\)\s*
    \.eq\(["']org_id["']\s*,\s*session\.orgId\);\s*\n
    [ \t]*if\s*\(error\)\s+return\s+\{\s*error:\s*error\.message\s*\};\s*\n
    """,
    re.VERBOSE,
)


def patch_action(path: Path) -> str:
    src = path.read_text()
    if "updateOrgScopedWithCheck" in src:
        return "skip:already-patched"
    m = PATTERN.search(src)
    if not m:
        return "skip:no-match"
    indent = m.group("indent")
    table = m.group("table")
    id_var = m.group("id_var")
    patch = m.group("patch").strip()
    # Friendly entity name from table name: clients → "Client".
    entity = table.rstrip("s").replace("_", " ").title() or "Row"
    repl = (
        f"{indent}// Sea Trial FINDING-022: optimistic concurrency.\n"
        f'{indent}const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");\n'
        f'{indent}const result = await updateOrgScopedWithCheck("{table}", session.orgId, {id_var}, expectedUpdatedAt, {patch});\n'
        f"{indent}if (!result.ok) {{\n"
        f'{indent}  return {{ error: result.reason === "stale" ? STALE_ROW_MESSAGE : "{entity} not found." }};\n'
        f"{indent}}}\n"
    )
    new_src = src[: m.start()] + repl + src[m.end():]

    # Add helper import after the first import block. We append to the last
    # local import (the canonical conventions place createClient last).
    if HELPER_IMPORT not in new_src:
        last_import = list(re.finditer(r'^import\s.+?from\s+["\']@/[^"\']+["\'];$', new_src, re.MULTILINE))
        if not last_import:
            return "skip:no-imports"
        last = last_import[-1]
        new_src = new_src[: last.end()] + "\n" + HELPER_IMPORT + new_src[last.end():]
    path.write_text(new_src)
    return f"ok:{table}"


def patch_page(path: Path) -> str:
    src = path.read_text()
    if 'name="_updated_at"' in src:
        return "skip:already-patched"
    # Inject after FormShell opening tag — first line that contains <FormShell.
    m = re.search(r"^([ \t]*)(<FormShell\b[^>]*>)\s*\n", src, re.MULTILINE)
    if not m:
        return "skip:no-formshell"
    inject_at = m.end()
    new_src = src[:inject_at] + HIDDEN_FIELD + src[inject_at:]
    path.write_text(new_src)
    return "ok"


def main():
    actions = sorted(ROOT.rglob("edit/actions.ts"))
    pages = []
    a_results = {}
    p_results = {}
    for a in actions:
        a_results[a] = patch_action(a)
        page = a.parent / "page.tsx"
        if page.exists():
            pages.append(page)
            p_results[page] = patch_page(page)

    print(f"\n=== ACTIONS ({len(actions)}) ===")
    for path, res in a_results.items():
        print(f"  {res:<30}  {path}")
    print(f"\n=== PAGES ({len(pages)}) ===")
    for path, res in p_results.items():
        print(f"  {res:<30}  {path}")

    summary_a = {}
    for r in a_results.values():
        key = r.split(":")[0]
        summary_a[key] = summary_a.get(key, 0) + 1
    print("\nactions summary:", summary_a)
    summary_p = {}
    for r in p_results.values():
        key = r.split(":")[0]
        summary_p[key] = summary_p.get(key, 0) + 1
    print("pages summary:", summary_p)


if __name__ == "__main__":
    main()
