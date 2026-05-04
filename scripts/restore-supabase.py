#!/usr/bin/env python3
"""
Walk every actions.ts in src/app, and for each function that references
`supabase.` without first defining it, insert
`const supabase = await createClient();` after the first `await
requireSession()` call in that function.
"""

import re
from pathlib import Path

ROOT = Path("src/app")

# Match an export async function block (very loose — body up to next blank
# `\n}` at column 0).
FUNC_PAT = re.compile(
    r"(export\s+async\s+function\s+\w+\s*\([^)]*\)\s*[^{]*\{)([\s\S]*?)(^\})",
    re.MULTILINE,
)


def patch_file(path: Path) -> bool:
    src = path.read_text()
    # Skip files that don't import createClient
    if "createClient" not in src:
        return False
    new_src = src
    changed = False

    def fix_func(m: re.Match) -> str:
        head, body, tail = m.group(1), m.group(2), m.group(3)
        # Already has supabase declared in this function?
        if re.search(r"const\s+supabase\s*=\s*await\s+createClient", body):
            return m.group(0)
        # Uses supabase?
        if not re.search(r"\bsupabase\.", body):
            return m.group(0)
        # Insert after the first `await requireSession(...)` call.
        sess_pat = re.compile(r"(await\s+requireSession\([^)]*\)\s*;\s*\n)")
        sm = sess_pat.search(body)
        if sm:
            insert_at = sm.end()
            new_body = (
                body[:insert_at]
                + "  const supabase = await createClient();\n"
                + body[insert_at:]
            )
        else:
            # No requireSession call — prepend at the top of the function.
            new_body = "  const supabase = await createClient();\n" + body
        return head + new_body + tail

    new_src = FUNC_PAT.sub(fix_func, new_src)
    if new_src != src:
        path.write_text(new_src)
        changed = True
    return changed


def main():
    n = 0
    for f in ROOT.rglob("actions.ts"):
        if patch_file(f):
            n += 1
            print(f"  ok {f}")
    print(f"\nrestored {n} files")


if __name__ == "__main__":
    main()
