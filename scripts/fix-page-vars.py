#!/usr/bin/env python3
"""
Fix the hidden _updated_at field on edit pages whose row variable is
not named `row`. Replace `defaultValue={row.updated_at}` with the
correct variable name.
"""

from pathlib import Path

# Page → row variable name (auditted from each page's `const X = data as ...`)
MAPPING = {
    "src/app/(platform)/console/forms/[formId]/edit/page.tsx": "form",
    "src/app/(platform)/console/inspections/[id]/edit/page.tsx": "insp",
    "src/app/(platform)/console/knowledge/[slug]/edit/page.tsx": "article",
    "src/app/(platform)/console/punch/[id]/edit/page.tsx": "item",
    "src/app/(platform)/console/rfis/[id]/edit/page.tsx": "rfi",
    "src/app/(platform)/console/site-plans/[id]/edit/page.tsx": "sp",
    "src/app/(platform)/console/submittals/[id]/edit/page.tsx": "sub",
}

NEEDLE = '<input type="hidden" name="_updated_at" defaultValue={row.updated_at} />'


def main():
    for path_str, var in MAPPING.items():
        p = Path(path_str)
        src = p.read_text()
        repl = f'<input type="hidden" name="_updated_at" defaultValue={{{var}.updated_at}} />'
        if NEEDLE not in src:
            print(f"skip:not-found {path_str}")
            continue
        p.write_text(src.replace(NEEDLE, repl))
        print(f"ok:{var} {path_str}")


if __name__ == "__main__":
    main()
