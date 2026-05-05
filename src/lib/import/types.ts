/**
 * Async import — Phase 6.4 of the SmartSuite parity roadmap.
 *
 * Per https://help.smartsuite.com/en/collections/2511067-getting-started, SmartSuite
 * imports are CSV/Excel only. Our v1 matches that: CSV upload, parse server-side,
 * stream rows into the resource via the existing per-resource importers
 * (crew/tasks/vendors), tracked via an `import_jobs` row that the UI polls.
 */

export type ImportResource = "crew_members" | "tasks" | "vendors" | "projects";

export type ImportSource = "csv" | "airtable" | "asana" | "json";

export type ImportJobState = "pending" | "parsing" | "inserting" | "success" | "failed" | "cancelled";

export type ImportRowError = {
  row: number;
  message: string;
};

export type ImportJob = {
  id: string;
  orgId: string;
  resource: ImportResource;
  source: ImportSource;
  sourceLabel: string | null;
  storagePath: string | null;
  state: ImportJobState;
  rowsTotal: number;
  rowsSucceeded: number;
  rowsFailed: number;
  errors: ImportRowError[];
  summary: string | null;
  jobId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export const IMPORT_RESOURCE_LABEL: Record<ImportResource, string> = {
  crew_members: "Crew",
  tasks: "Tasks",
  vendors: "Vendors",
  projects: "Projects",
};
