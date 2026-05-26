/**
 * Schedule importers for P6 / MSP / Asta XER+XML (gap G-002 runtime).
 *
 * Pure-TS, no external deps. Produces a canonical `ParsedSchedule` shape
 * that the import endpoint then writes into schedule_baselines +
 * _activities + _dependencies + _calendars.
 *
 * Supported source formats:
 *   - P6 XER (Primavera P6 tab-delimited export)
 *   - P6 XML / MSP XML / Asta XML (subset — uses common element names)
 *
 * Each parser is best-effort on the most common columns. Edge cases
 * (resource assignments, custom calendars, baseline-of-baseline) are
 * intentionally skipped — they round-trip as raw notes_md rather than
 * causing a parse failure.
 */

export type ImportedActivity = {
  source_id: string; // P6 task_id or XML UID
  code: string;
  name: string;
  wbs_path: string | null;
  start_planned: string; // ISO 8601
  finish_planned: string;
  duration_days: number;
  constraint_type:
    | "none"
    | "start_no_earlier_than"
    | "start_no_later_than"
    | "finish_no_earlier_than"
    | "finish_no_later_than"
    | "must_start_on"
    | "must_finish_on"
    | "as_soon_as_possible"
    | "as_late_as_possible";
  constraint_date: string | null;
  percent_complete: number;
  notes_md: string | null;
};

export type ImportedDependency = {
  predecessor_source_id: string;
  successor_source_id: string;
  dep_type: "fs" | "ss" | "ff" | "sf";
  lag_days: number;
};

export type ImportedCalendar = {
  source_id: string;
  name: string;
  work_days_mask: number;
  holidays: string[]; // ISO dates
  hours_per_day: number;
};

export type ParsedSchedule = {
  source_format: "p6_xer" | "p6_xml" | "msp_xml" | "asta_xml";
  source_name: string | null;
  activities: ImportedActivity[];
  dependencies: ImportedDependency[];
  calendars: ImportedCalendar[];
  warnings: string[];
};

// ============================================================================
// Format detection
// ============================================================================

export function detectFormat(content: string): ParsedSchedule["source_format"] | null {
  const head = content.slice(0, 4096).toLowerCase();
  if (head.startsWith("ermhdr\t") || head.startsWith("ermhdr,")) return "p6_xer";
  if (head.includes("<apibo") || head.includes("primavera p6")) return "p6_xml";
  if (head.includes("<project ") && head.includes("microsoft project")) return "msp_xml";
  if (head.includes("<powerproject") || head.includes("asta powerproject")) return "asta_xml";
  // Fall back to MSP XML for generic <Project> roots.
  if (head.includes("<project ") || head.includes("<project>")) return "msp_xml";
  return null;
}

// ============================================================================
// P6 XER parser (tab-delimited)
// ============================================================================

const P6_CONSTRAINT_MAP: Record<string, ImportedActivity["constraint_type"]> = {
  CS_MEO: "must_start_on",
  CS_MEOA: "must_finish_on",
  CS_MEOB: "must_finish_on",
  CS_MSO: "must_start_on",
  CS_MSOA: "start_no_later_than",
  CS_MSOB: "start_no_earlier_than",
  CS_MANDFIN: "must_finish_on",
  CS_MANDSTART: "must_start_on",
  CS_ALAP: "as_late_as_possible",
  CS_ASAP: "as_soon_as_possible",
};

function parseP6Xer(content: string): ParsedSchedule {
  const lines = content.split(/\r?\n/);
  const warnings: string[] = [];
  let currentTable: string | null = null;
  let currentHeader: string[] = [];

  const taskRows: Record<string, string>[] = [];
  const predRows: Record<string, string>[] = [];
  const calRows: Record<string, string>[] = [];
  const projRows: Record<string, string>[] = [];

  for (const line of lines) {
    if (line.startsWith("%T\t")) {
      currentTable = line.slice(3).trim();
      currentHeader = [];
      continue;
    }
    if (line.startsWith("%F\t")) {
      currentHeader = line.slice(3).split("\t");
      continue;
    }
    if (line.startsWith("%R\t") && currentHeader.length > 0) {
      const cells = line.slice(3).split("\t");
      const row: Record<string, string> = {};
      currentHeader.forEach((col, i) => {
        row[col] = cells[i] ?? "";
      });
      if (currentTable === "TASK") taskRows.push(row);
      else if (currentTable === "TASKPRED") predRows.push(row);
      else if (currentTable === "CALENDAR") calRows.push(row);
      else if (currentTable === "PROJECT") projRows.push(row);
    }
  }

  const sourceName = projRows[0]?.proj_short_name ?? projRows[0]?.proj_id ?? null;

  // Build activities.
  const activities: ImportedActivity[] = taskRows.map((row) => {
    const start = row.target_start_date || row.act_start_date || row.early_start_date || "";
    const finish = row.target_end_date || row.act_end_date || row.early_end_date || "";
    const durHrs = Number(row.target_drtn_hr_cnt ?? 0);
    const constraintCode = row.cstr_type ?? "";
    const constraint_type = P6_CONSTRAINT_MAP[constraintCode] ?? "none";
    return {
      source_id: row.task_id ?? "",
      code: row.task_code ?? row.task_id ?? "",
      name: row.task_name ?? "(unnamed)",
      wbs_path: row.wbs_id ?? null,
      start_planned: normalizeDate(start),
      finish_planned: normalizeDate(finish),
      duration_days: durHrs > 0 ? durHrs / 8 : 0,
      constraint_type,
      constraint_date: row.cstr_date ? normalizeDate(row.cstr_date) : null,
      percent_complete: Number(row.phys_complete_pct ?? row.act_work_qty ?? 0),
      notes_md: row.task_descr || null,
    };
  });

  const dependencies: ImportedDependency[] = predRows.map((row) => {
    const depType = (row.pred_type ?? "PR_FS").replace("PR_", "").toLowerCase() as "fs" | "ss" | "ff" | "sf";
    return {
      predecessor_source_id: row.pred_task_id ?? "",
      successor_source_id: row.task_id ?? "",
      dep_type: ["fs", "ss", "ff", "sf"].includes(depType) ? depType : "fs",
      lag_days: Number(row.lag_hr_cnt ?? 0) / 8,
    };
  });

  // P6 calendars use Excel-ish encoding for work days; we extract a
  // reasonable default work-days mask. Detailed exceptions are deferred.
  const calendars: ImportedCalendar[] = calRows.map((row) => ({
    source_id: row.clndr_id ?? "",
    name: row.clndr_name ?? row.clndr_id ?? "Calendar",
    work_days_mask: 62, // M-F default
    holidays: [],
    hours_per_day: Number(row.day_hr_cnt ?? 8),
  }));

  if (taskRows.length === 0) warnings.push("No TASK rows found in XER — file may be empty or malformed.");

  return {
    source_format: "p6_xer",
    source_name: sourceName,
    activities,
    dependencies,
    calendars,
    warnings,
  };
}

// ============================================================================
// Generic XML parser (P6 XML / MSP XML / Asta) — DOM-free, regex-based to
// avoid an XML lib dep. Robust enough for the common shapes; bails out
// gracefully on unfamiliar structures.
// ============================================================================

function xmlBody(content: string, tag: string, attrs?: string): string | null {
  const attrPattern = attrs ? attrs.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&") + "[^>]*" : "[^>]*";
  const re = new RegExp(`<${tag}\\b${attrPattern}>([\\s\\S]*?)<\\/${tag}>`, "i");
  return content.match(re)?.[1] ?? null;
}

function xmlBodies(content: string, tag: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) out.push(m[1]);
  return out;
}

function xmlText(content: string, tag: string): string | null {
  const body = xmlBody(content, tag);
  if (body == null) return null;
  return body
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

function normalizeDate(s: string): string {
  if (!s) return new Date().toISOString();
  const trimmed = s.trim();
  // P6 XER format: "YYYY-MM-DD HH:mm" — convert to ISO.
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(trimmed)) {
    return trimmed.replace(" ", "T") + ":00Z";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00Z`;
  }
  try {
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  } catch {
    // fall through
  }
  return new Date().toISOString();
}

function parseGenericXml(content: string, format: ParsedSchedule["source_format"]): ParsedSchedule {
  const warnings: string[] = [];

  // MSP shape: <Tasks><Task><UID>...</UID><Name>...</Name>...
  // P6 XML shape: <Activity ObjectId="...">...
  // Asta shape similar to MSP.
  const taskBodies =
    format === "p6_xml"
      ? xmlBodies(content, "Activity")
      : [...xmlBodies(content, "Task"), ...xmlBodies(content, "task")];

  const activities: ImportedActivity[] = taskBodies.map((body) => {
    const id = xmlText(body, "UID") ?? xmlText(body, "ObjectId") ?? xmlText(body, "ID") ?? "";
    const code = xmlText(body, "Code") ?? xmlText(body, "ActivityID") ?? id;
    const name = xmlText(body, "Name") ?? xmlText(body, "ActivityName") ?? "(unnamed)";
    const start =
      xmlText(body, "Start") ??
      xmlText(body, "StartDate") ??
      xmlText(body, "EarlyStart") ??
      xmlText(body, "ActualStart") ??
      "";
    const finish =
      xmlText(body, "Finish") ??
      xmlText(body, "FinishDate") ??
      xmlText(body, "EarlyFinish") ??
      xmlText(body, "ActualFinish") ??
      "";
    const durStr = xmlText(body, "Duration") ?? xmlText(body, "PlannedDuration") ?? "";
    let durationDays = 0;
    // ISO 8601 duration PT8H0M0S → 1 day. MSP uses minutes; fall back.
    if (durStr) {
      const ptMatch = durStr.match(/PT(\d+)H/);
      if (ptMatch) durationDays = Number(ptMatch[1]) / 8;
      else durationDays = Number(durStr) || 0;
    }
    return {
      source_id: id,
      code,
      name,
      wbs_path: xmlText(body, "WBS") ?? null,
      start_planned: normalizeDate(start),
      finish_planned: normalizeDate(finish),
      duration_days: durationDays,
      constraint_type: "none",
      constraint_date: null,
      percent_complete: Number(xmlText(body, "PhysicalPercentComplete") ?? xmlText(body, "PercentComplete") ?? 0),
      notes_md: xmlText(body, "Notes"),
    };
  });

  // Dependencies live in <PredecessorLink>...</PredecessorLink> (MSP) or
  // <Relationship>...</Relationship> (P6).
  const relBodies =
    format === "p6_xml"
      ? xmlBodies(content, "Relationship")
      : [...xmlBodies(content, "PredecessorLink"), ...xmlBodies(content, "Relation")];

  const dependencies: ImportedDependency[] = relBodies.map((body) => {
    const predUID =
      xmlText(body, "PredecessorUID") ??
      xmlText(body, "PredecessorActivityObjectId") ??
      xmlText(body, "Predecessor") ??
      "";
    const succUID =
      xmlText(body, "SuccessorUID") ?? xmlText(body, "SuccessorActivityObjectId") ?? xmlText(body, "Successor") ?? "";
    const typeRaw = xmlText(body, "Type") ?? "0";
    let depType: ImportedDependency["dep_type"] = "fs";
    // MSP encoding: 0=FF, 1=FS, 2=SF, 3=SS.
    if (typeRaw === "0") depType = "ff";
    else if (typeRaw === "1") depType = "fs";
    else if (typeRaw === "2") depType = "sf";
    else if (typeRaw === "3") depType = "ss";
    // P6 encoding: "Finish to Start" etc.
    if (typeRaw.toLowerCase().includes("start to start")) depType = "ss";
    else if (typeRaw.toLowerCase().includes("finish to finish")) depType = "ff";
    else if (typeRaw.toLowerCase().includes("start to finish")) depType = "sf";

    const lagMin = Number(xmlText(body, "LinkLag") ?? xmlText(body, "Lag") ?? 0);
    // MSP lag is in tenths of a minute; convert to days for storage.
    const lagDays = lagMin / 10 / 60 / 8;
    return { predecessor_source_id: predUID, successor_source_id: succUID, dep_type: depType, lag_days: lagDays };
  });

  if (activities.length === 0)
    warnings.push("No <Task>/<Activity> nodes found — file may not be a recognized P6/MSP/Asta XML export.");

  return {
    source_format: format,
    source_name: xmlText(content, "Name") ?? xmlText(content, "ProjectName"),
    activities,
    dependencies,
    calendars: [],
    warnings,
  };
}

// ============================================================================
// Public entry point
// ============================================================================

export function parseSchedule(content: string): ParsedSchedule {
  const format = detectFormat(content);
  if (format === "p6_xer") return parseP6Xer(content);
  if (format === "p6_xml" || format === "msp_xml" || format === "asta_xml") return parseGenericXml(content, format);
  return {
    source_format: "msp_xml",
    source_name: null,
    activities: [],
    dependencies: [],
    calendars: [],
    warnings: ["Could not detect schedule format. Supported: P6 XER, P6 XML, MSP XML, Asta XML."],
  };
}
