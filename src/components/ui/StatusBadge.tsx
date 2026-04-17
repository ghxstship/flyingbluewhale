import { Badge, type BadgeVariant } from "./Badge";

const MAP: Record<string, BadgeVariant> = {
  draft: "muted", pending: "muted",
  active: "success", submitted: "info",
  paused: "warning", revision_requested: "warning", open: "warning",
  archived: "muted", complete: "default", closed: "default",
  approved: "success", paid: "success", sent: "info",
  rejected: "error", voided: "error", overdue: "error",
  scanned: "success", issued: "info", transferred: "info",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={MAP[status] ?? "default"}>{status.replace(/_/g, " ")}</Badge>;
}
