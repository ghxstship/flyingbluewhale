"use client";

// Compliance auto-assignment — Docebo competitive feature (2025-2026).
// Bulk-assigns this course to all org members who match the course's
// required_for_role (or all members if the field is blank). Idempotent:
// already-assigned members are skipped.

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { autoAssignComplianceCourses } from "./actions";

export function ComplianceAutoAssignButton({
  courseId,
  requiredForRole,
}: {
  courseId: string;
  requiredForRole: string | null;
}) {
  const [pending, start] = useTransition();

  function run() {
    start(async () => {
      const result = await autoAssignComplianceCourses(courseId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.assigned === 0) {
        toast.info("All eligible members are already assigned.");
      } else {
        toast.success(
          `Auto-assigned to ${result.assigned} member${result.assigned !== 1 ? "s" : ""}.`,
        );
      }
    });
  }

  const label = requiredForRole
    ? `Auto-assign to all "${requiredForRole}" members`
    : "Auto-assign to all members";

  return (
    <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={run}>
      {pending ? "Assigning…" : `⚡ ${label}`}
    </Button>
  );
}
