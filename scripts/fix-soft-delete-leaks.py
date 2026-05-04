#!/usr/bin/env python3
"""
Add `.is("deleted_at", null)` to direct supabase queries that hit a
SOFT_DELETABLE table outside of the *OrgScoped helpers.

Sea Trial sweep: all 14 SOFT_DELETABLE tables auto-bump `deleted_at`
on soft-delete; pages that query them with raw `.from(table).select(...)`
must filter or risk surfacing archived rows.

Conservative pattern: insert `.is("deleted_at", null)` immediately after
the first `.eq("org_id", ...)` call on a select chain that targets one
of the SOFT_DELETABLE tables. Skips chains that already include the
filter or are inside `*/edit/actions.ts` (already covered).
"""

import re
from pathlib import Path
import sys

ROOT = Path("src/app")
SOFT_DELETABLE = {
    "projects",
    "clients",
    "vendors",
    "invoices",
    "purchase_orders",
    "equipment",
    "proposals",
    "event_guides",
    "deliverables",
    "notifications",
    "email_templates",
    "webhook_endpoints",
    "stage_plots",
    "incidents",
}

# Match a select chain on a soft-deletable table that includes
# .eq("org_id", ...) but NO .is("deleted_at", null).
def patch_file(path: Path) -> int:
    src = path.read_text()
    new_src = src
    changed = 0
    for table in SOFT_DELETABLE:
        # Find each chain starting at .from("TABLE") and ending at the
        # next semicolon or close-paren that ends the statement.
        pat = re.compile(
            r'(\.from\(["\']' + re.escape(table) + r'["\']\))'
            r'(?P<chain>(?:\.[\w]+\([^)]*\))+?)'
            r'(?P<terminator>;|\.maybeSingle\(\)|\.single\(\))',
            re.DOTALL,
        )
        for m in list(pat.finditer(new_src)):
            chain = m.group("chain")
            if 'deleted_at' in chain:
                continue
            if '.eq("org_id"' not in chain and ".eq('org_id'" not in chain:
                # Some queries don't scope by org (e.g. lookup by slug only).
                # Skip — we can't blindly add a deleted_at filter here.
                continue
            # Insert .is("deleted_at", null) after the first .eq("org_id", ...)
            org_eq_pat = re.compile(r'(\.eq\(["\']org_id["\']\s*,[^)]*\))')
            new_chain = org_eq_pat.sub(r'\1.is("deleted_at", null)', chain, count=1)
            if new_chain == chain:
                continue
            full_old = m.group(0)
            full_new = m.group(1) + new_chain + m.group("terminator")
            new_src = new_src.replace(full_old, full_new, 1)
            changed += 1
    if changed:
        path.write_text(new_src)
    return changed


def main():
    targets = list(ROOT.rglob("page.tsx")) + list(ROOT.rglob("route.ts")) + list(ROOT.rglob("route.tsx"))
    total = 0
    for f in targets:
        # Skip edit/actions.ts files — those use helpers.
        s = str(f)
        if "/edit/actions" in s:
            continue
        n = patch_file(f)
        if n:
            print(f"  +{n}  {f}")
            total += n
    print(f"\ntotal patched: {total}")


if __name__ == "__main__":
    main()
