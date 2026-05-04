#!/usr/bin/env python3
"""
Add `updated_at: string;` to local `type X = { ... };` definitions in
edit pages that shadow the global type aliases. Also rewrites the
matching `.select(...)` to include `updated_at` so the cast is honest.
"""

import re
from pathlib import Path

TARGETS = {
    "src/app/(platform)/console/inspections/[id]/edit/page.tsx": "Inspection",
    "src/app/(platform)/console/knowledge/[slug]/edit/page.tsx": "Article",
    "src/app/(platform)/console/punch/[id]/edit/page.tsx": "PunchItem",
    "src/app/(platform)/console/rfis/[id]/edit/page.tsx": "Rfi",
    "src/app/(platform)/console/site-plans/[id]/edit/page.tsx": "SitePlan",
    "src/app/(platform)/console/submittals/[id]/edit/page.tsx": "Submittal",
}


def patch(path_str: str, type_name: str) -> str:
    p = Path(path_str)
    src = p.read_text()
    # Find `type Foo = { ... };` and inject `updated_at: string;` before `};`.
    pat = re.compile(
        r"(type\s+" + re.escape(type_name) + r"\s*=\s*\{)([^{}]*?)(\n\}\;)",
        re.DOTALL,
    )
    m = pat.search(src)
    if not m:
        return f"skip:no-type {path_str}"
    body = m.group(2)
    if "updated_at" in body:
        return f"skip:already-has {path_str}"
    new_body = body.rstrip() + "\n  updated_at: string;"
    new_text = m.group(1) + new_body + m.group(3)
    src = src[: m.start()] + new_text + src[m.end():]

    # Also append `updated_at` to any `.select("...")` that doesn't already
    # include it. We're conservative — only touching the FIRST select on
    # the table the page actually edits.
    sel_pat = re.compile(r'(\.select\(")([^"]*?)(")', re.DOTALL)
    sm = sel_pat.search(src)
    if sm:
        cols = sm.group(2)
        if "updated_at" not in cols:
            new_cols = cols.rstrip(", ") + ", updated_at"
            src = src[: sm.start()] + sm.group(1) + new_cols + sm.group(3) + src[sm.end():]

    p.write_text(src)
    return f"ok {path_str}"


def main():
    for path_str, name in TARGETS.items():
        print(patch(path_str, name))


if __name__ == "__main__":
    main()
