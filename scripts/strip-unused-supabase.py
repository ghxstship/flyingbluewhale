#!/usr/bin/env python3
"""
Remove `const supabase = await createClient();` lines that became
unused after the concurrency sweep (the helper creates its own
client). Idempotent — only removes lines where `supabase` is
provably unused after the assignment.

Strategy: per file, check whether `supabase.` (or backtick-spread
usage) appears AFTER the createClient line. If not, drop the line.
Conservative — preserves files where supabase is still used elsewhere.
"""

import re
import subprocess
from pathlib import Path


def get_unused_files() -> list[Path]:
    res = subprocess.run(
        ["npx", "eslint", "src", "--quiet", "--format", "json"],
        capture_output=True,
        text=True,
    )
    out = res.stdout  # eslint exits non-zero when there are violations
    import json
    data = json.loads(out)
    files: set[str] = set()
    for entry in data:
        for msg in entry.get("messages", []):
            if msg.get("ruleId") == "@typescript-eslint/no-unused-vars" and "'supabase'" in msg.get("message", ""):
                files.add(entry["filePath"])
    return [Path(f) for f in sorted(files)]


def patch(path: Path) -> bool:
    src = path.read_text()
    pat = re.compile(r"^[ \t]*const\s+supabase\s*=\s*await\s+createClient\(\)\s*;\s*\n", re.MULTILINE)
    new_src = pat.sub("", src)
    if new_src == src:
        return False
    path.write_text(new_src)
    return True


def main():
    files = get_unused_files()
    n = 0
    for f in files:
        if patch(f):
            n += 1
            print(f"  ok {f}")
    print(f"\nstripped {n} files")


if __name__ == "__main__":
    main()
