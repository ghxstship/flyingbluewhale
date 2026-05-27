import "server-only";

/**
 * State certified-payroll XML exporters (gap G-010 follow-up).
 *
 * Renders payroll_runs + payroll_run_lines to the canonical state-mandated
 * XML format. Each state has its own schema:
 *
 *   CA DIR (eCPR): per the CA Dept of Industrial Relations. XSD at
 *     https://www.dir.ca.gov/Public-Works/eCPR.html. Each weekly upload
 *     is one <PayrollReport> root w/ project metadata + <Employee>
 *     children carrying classification, hours-by-day, gross, fringes,
 *     deductions, net.
 *
 *   NY PWA: NY State Prevailing Wage Affidavits. <PRWAffidavit> root.
 *
 *   WA L&I: PrismWeb XML upload. <PrevailingWage> root.
 *
 * No state has a public XSD that's both stable and freely versioned
 * across releases; we render to the canonical structural names that
 * have held across multiple cycles. The CSV-equivalent uploads remain
 * the fall-back if a particular state rejects an XML version.
 *
 * Pure-function in/out so unit-testable. Caller passes the hydrated
 * row set; this returns the XML string.
 */

export type CertifiedPayrollInput = {
  agency: "ca_dir" | "ny_pwa" | "wa_lni";
  org_name: string;
  contractor: {
    name: string;
    license_number?: string;
    address?: string;
    fein?: string;
  };
  project: {
    name: string;
    address?: string;
    awarding_body?: string;
    contract_number?: string;
  };
  payroll: {
    week_ending: string; // YYYY-MM-DD
    pay_period_start: string;
    pay_period_end: string;
    payroll_number?: number;
    is_final?: boolean;
  };
  workers: Array<{
    full_name: string;
    ssn_last_4: string | null;
    classification: string;
    hours_by_day: number[]; // length 7, [Sun..Sat]
    hours_st: number;
    hours_ot: number;
    hours_dt: number;
    rate_st: number;
    rate_ot?: number;
    rate_dt?: number;
    gross: number;
    fringes_cash: number;
    fringes_to_plans: number;
    deductions: Record<string, number>;
    net: number;
  }>;
};

function xmlEscape(s: string | number | undefined | null): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function moneyAttr(n: number): string {
  return Number(n).toFixed(2);
}

function renderCaDir(input: CertifiedPayrollInput): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    `<PayrollReport xmlns="http://www.dir.ca.gov/eCPR" version="1.0" weekEnding="${input.payroll.week_ending}" payrollNumber="${input.payroll.payroll_number ?? 1}" isFinal="${input.payroll.is_final ? "true" : "false"}">`,
  );
  lines.push(
    `  <Contractor name="${xmlEscape(input.contractor.name)}" fein="${xmlEscape(input.contractor.fein)}" licenseNumber="${xmlEscape(input.contractor.license_number)}">`,
  );
  if (input.contractor.address) lines.push(`    <Address>${xmlEscape(input.contractor.address)}</Address>`);
  lines.push(`  </Contractor>`);
  lines.push(
    `  <Project name="${xmlEscape(input.project.name)}" awardingBody="${xmlEscape(input.project.awarding_body)}" contractNumber="${xmlEscape(input.project.contract_number)}">`,
  );
  if (input.project.address) lines.push(`    <Address>${xmlEscape(input.project.address)}</Address>`);
  lines.push(`  </Project>`);
  for (const w of input.workers) {
    lines.push(
      `  <Employee fullName="${xmlEscape(w.full_name)}" ssnLast4="${xmlEscape(w.ssn_last_4)}" classification="${xmlEscape(w.classification)}">`,
    );
    lines.push(
      `    <Hours sun="${w.hours_by_day[0] ?? 0}" mon="${w.hours_by_day[1] ?? 0}" tue="${w.hours_by_day[2] ?? 0}" wed="${w.hours_by_day[3] ?? 0}" thu="${w.hours_by_day[4] ?? 0}" fri="${w.hours_by_day[5] ?? 0}" sat="${w.hours_by_day[6] ?? 0}" />`,
    );
    lines.push(`    <HoursTotal st="${w.hours_st}" ot="${w.hours_ot}" dt="${w.hours_dt}" />`);
    lines.push(
      `    <Rates st="${moneyAttr(w.rate_st)}" ot="${moneyAttr(w.rate_ot ?? w.rate_st * 1.5)}" dt="${moneyAttr(w.rate_dt ?? w.rate_st * 2)}" />`,
    );
    lines.push(
      `    <Pay gross="${moneyAttr(w.gross)}" fringesCash="${moneyAttr(w.fringes_cash)}" fringesToPlans="${moneyAttr(w.fringes_to_plans)}" net="${moneyAttr(w.net)}" />`,
    );
    lines.push(`    <Deductions>`);
    for (const [k, v] of Object.entries(w.deductions)) {
      lines.push(`      <Deduction kind="${xmlEscape(k)}" amount="${moneyAttr(v)}" />`);
    }
    lines.push(`    </Deductions>`);
    lines.push(`  </Employee>`);
  }
  lines.push(`</PayrollReport>`);
  return lines.join("\n");
}

function renderNyPwa(input: CertifiedPayrollInput): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    `<PRWAffidavit xmlns="http://www.labor.ny.gov/prw" weekEnding="${input.payroll.week_ending}" payrollNumber="${input.payroll.payroll_number ?? 1}">`,
  );
  lines.push(`  <Contractor name="${xmlEscape(input.contractor.name)}" fein="${xmlEscape(input.contractor.fein)}" />`);
  lines.push(
    `  <PublicWork project="${xmlEscape(input.project.name)}" awardingAgency="${xmlEscape(input.project.awarding_body)}" />`,
  );
  for (const w of input.workers) {
    lines.push(
      `  <Worker name="${xmlEscape(w.full_name)}" ssnLast4="${xmlEscape(w.ssn_last_4)}" trade="${xmlEscape(w.classification)}" hoursST="${w.hours_st}" hoursOT="${w.hours_ot}" rateST="${moneyAttr(w.rate_st)}" gross="${moneyAttr(w.gross)}" fringes="${moneyAttr(w.fringes_cash + w.fringes_to_plans)}" net="${moneyAttr(w.net)}" />`,
    );
  }
  lines.push(`</PRWAffidavit>`);
  return lines.join("\n");
}

function renderWaLni(input: CertifiedPayrollInput): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<PrevailingWage xmlns="https://lni.wa.gov/prevailing-wage" weekEnding="${input.payroll.week_ending}">`);
  lines.push(
    `  <Contractor name="${xmlEscape(input.contractor.name)}" license="${xmlEscape(input.contractor.license_number)}" />`,
  );
  lines.push(
    `  <Job name="${xmlEscape(input.project.name)}" awardingAgency="${xmlEscape(input.project.awarding_body)}" contractNumber="${xmlEscape(input.project.contract_number)}" />`,
  );
  for (const w of input.workers) {
    const totalHours = (w.hours_by_day ?? []).reduce((s, h) => s + Number(h ?? 0), 0);
    lines.push(
      `  <Employee name="${xmlEscape(w.full_name)}" ssnLast4="${xmlEscape(w.ssn_last_4)}" classification="${xmlEscape(w.classification)}" totalHours="${totalHours}" gross="${moneyAttr(w.gross)}" net="${moneyAttr(w.net)}" />`,
    );
  }
  lines.push(`</PrevailingWage>`);
  return lines.join("\n");
}

export function renderCertifiedPayrollXml(input: CertifiedPayrollInput): string {
  switch (input.agency) {
    case "ca_dir":
      return renderCaDir(input);
    case "ny_pwa":
      return renderNyPwa(input);
    case "wa_lni":
      return renderWaLni(input);
    default:
      throw new Error(`Unsupported agency: ${input.agency}`);
  }
}
