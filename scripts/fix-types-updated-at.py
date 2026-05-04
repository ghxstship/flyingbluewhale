#!/usr/bin/env python3
"""
Add `updated_at: string;` to every hand-rolled type alias in
src/lib/supabase/types.ts that the concurrency sweep needs but is
missing it.

Reads tsc output to know which types need patching, then injects the
field right before the closing `}` of each named type definition.
"""

import re
import sys
from pathlib import Path

TYPES_FILE = Path("src/lib/supabase/types.ts")

# Explicit list pulled from the typecheck failures after the bulk
# concurrency sweep. Adding updated_at to each.
TYPES_NEEDING = [
    "AccommodationBlock",
    "AccreditationCategory",
    "AccreditationChange",
    "RateCardItem",
    "TicketType",
    "Budget",
    "MileageLog",
    "TimeEntry",
    "InsurancePolicy",
    "Trademark",
    "Location",
    "DelegationEntry",
    "Credential",
    "CrewMember",
    "Requisition",
    "FabricationOrder",
    "Rental",
    "CrisisAlert",
    "EnvironmentalEvent",
    "MajorIncident",
    "MedicalEncounter",
    "SustainabilityMetric",
    "AdManifest",
    "DispatchRun",
    "WorkforceDeployment",
    "Inspection",
    "PunchItem",
    "Rfi",
    "SitePlan",
    "Submittal",
]


def main() -> int:
    src = TYPES_FILE.read_text()
    patched: list[str] = []
    skipped: list[str] = []
    for name in TYPES_NEEDING:
        # Match `export type NAME = { ... };` where the body is balanced.
        pattern = re.compile(
            r"(export type " + re.escape(name) + r"\s*=\s*\{)([^{}]*)(\};)",
            re.DOTALL,
        )
        m = pattern.search(src)
        if not m:
            skipped.append(f"{name}:not-found")
            continue
        body = m.group(2)
        if "updated_at" in body:
            skipped.append(f"{name}:already-has")
            continue
        # Insert before the last newline + indent inside the body.
        # Look for the trailing whitespace before the closing brace.
        new_body = body.rstrip()
        # Ensure trailing semicolon on prior member.
        if not new_body.endswith(";"):
            new_body += ";"
        new_body += "\n  updated_at: string;\n"
        new_text = m.group(1) + new_body + m.group(3)
        src = src[: m.start()] + new_text + src[m.end():]
        patched.append(name)

    TYPES_FILE.write_text(src)
    print(f"patched {len(patched)}: {patched}")
    if skipped:
        print(f"skipped {len(skipped)}: {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
