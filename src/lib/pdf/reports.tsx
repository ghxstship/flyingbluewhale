import "server-only";

import React from "react";
import { Text } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, PdfDocument, PdfTable, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";

/**
 * Compact batch of simple report PDFs. Each exported component is a
 * thin wrapper over <PdfTable> with a cover page — small renderers
 * that share the same shape live here rather than proliferating single-
 * file modules.
 *
 *   #14 Signage grid (covered by per-deliverable SignageGridView; this file
 *       adds a project-wide variant that pulls from deliverables + locations)
 *   #17 Expense / timesheet / mileage report (projects.expenses +
 *       time_entries + mileage_logs)
 *   #24 Punch list / task report (projects.tasks)
 *   #25 Rental checkout / pull sheet (rentals + equipment)
 */

/** Request-scoped translator: `t(key, vars?, fallback?)`. */
export type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

/** Identity fallback used when no translator is threaded in (existing callers). */
const identityT: Translator = (_k, _v, fb) => fb ?? "";

// ── #17 expense report ────────────────────────────────────────────

export function ExpenseReportPdf({
  brand,
  t = identityT,
  project,
  rangeFrom,
  rangeTo,
  expenses,
  time,
  mileage,
  totalCents,
  currency,
}: {
  brand: PdfBrand;
  t?: Translator;
  project: { name: string };
  rangeFrom: string;
  rangeTo: string;
  expenses: Array<{ description: string; date: string | null; amount_cents: number }>;
  time: Array<{ user_name: string | null; hours: number; rate_cents: number | null; date: string | null }>;
  mileage: Array<{ user_name: string | null; miles: number; rate_per_mile_cents: number | null; date: string | null }>;
  totalCents: number;
  currency: string;
}) {
  const money = (c: number) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(c / 100);
    } catch {
      return `${currency} ${(c / 100).toFixed(2)}`;
    }
  };
  const expenseReportTitle = t("pdf.reports.expense.title", undefined, "Expense report");
  const totalWord = t("pdf.reports.expense.total", undefined, "Total");
  return (
    <PdfDocument
      title={`${expenseReportTitle} · ${project.name}`}
      author={brand.producerName}
      subject={expenseReportTitle}
    >
      <CoverPage
        brand={brand}
        eyebrow={t("pdf.reports.expense.eyebrow", undefined, "Expense Report")}
        title={project.name}
        subtitle={`${rangeFrom} → ${rangeTo} · ${totalWord} ${money(totalCents)}`}
      />
      <BrandedPage brand={brand} pageLabel={expenseReportTitle}>
        <SectionHeading title={t("pdf.reports.expense.expenses", undefined, "Expenses")} />
        <PdfTable
          columns={[
            { key: "date", label: t("pdf.reports.expense.colDate", undefined, "Date"), width: 1.5 },
            { key: "description", label: t("pdf.reports.expense.colDescription", undefined, "Description"), width: 6 },
            { key: "amount", label: t("pdf.reports.expense.colAmount", undefined, "Amount"), width: 2, align: "right" },
          ]}
          rows={expenses.map((e) => ({
            date: e.date ?? "",
            description: e.description,
            amount: money(e.amount_cents),
          }))}
        />
        <SectionHeading title={t("pdf.reports.expense.timeEntries", undefined, "Time Entries")} />
        <PdfTable
          columns={[
            { key: "date", label: t("pdf.reports.expense.colDate", undefined, "Date"), width: 1.5 },
            { key: "user", label: t("pdf.reports.expense.colMember", undefined, "Member"), width: 3 },
            { key: "hours", label: t("pdf.reports.expense.colHours", undefined, "Hours"), width: 1, align: "right" },
            { key: "rate", label: t("pdf.reports.expense.colRate", undefined, "Rate"), width: 2, align: "right" },
            { key: "amount", label: t("pdf.reports.expense.colAmount", undefined, "Amount"), width: 2, align: "right" },
          ]}
          rows={time.map((t) => ({
            date: t.date ?? "",
            user: t.user_name ?? "",
            hours: String(t.hours),
            rate: t.rate_cents != null ? money(t.rate_cents) : "",
            amount: t.rate_cents != null ? money(Math.round(t.hours * t.rate_cents)) : "",
          }))}
        />
        <SectionHeading title={t("pdf.reports.expense.mileage", undefined, "Mileage")} />
        <PdfTable
          columns={[
            { key: "date", label: t("pdf.reports.expense.colDate", undefined, "Date"), width: 1.5 },
            { key: "user", label: t("pdf.reports.expense.colMember", undefined, "Member"), width: 3 },
            { key: "miles", label: t("pdf.reports.expense.colMiles", undefined, "Miles"), width: 1, align: "right" },
            {
              key: "rate",
              label: t("pdf.reports.expense.colRatePerMile", undefined, "Rate/mi"),
              width: 2,
              align: "right",
            },
            { key: "amount", label: t("pdf.reports.expense.colAmount", undefined, "Amount"), width: 2, align: "right" },
          ]}
          rows={mileage.map((m) => ({
            date: m.date ?? "",
            user: m.user_name ?? "",
            miles: String(m.miles),
            rate: m.rate_per_mile_cents != null ? money(m.rate_per_mile_cents) : "",
            amount: m.rate_per_mile_cents != null ? money(Math.round(m.miles * m.rate_per_mile_cents)) : "",
          }))}
        />
        <Text style={{ ...styles.p, marginTop: 20, fontWeight: 700, fontSize: 14 }}>
          {totalWord} — {money(totalCents)}
        </Text>
      </BrandedPage>
    </PdfDocument>
  );
}

// ── #24 task / punch-list report ──────────────────────────────────

export function TaskReportPdf({
  brand,
  t = identityT,
  project,
  tasks,
}: {
  brand: PdfBrand;
  t?: Translator;
  project: { name: string };
  tasks: Array<{
    title: string;
    status: string | null;
    priority: string | null;
    assignee_name: string | null;
    due_at: string | null;
  }>;
}) {
  const tasksWord = t("pdf.reports.task.tasksWord", undefined, "Tasks");
  return (
    <PdfDocument
      title={`${tasksWord} · ${project.name}`}
      author={brand.producerName}
      subject={t("pdf.reports.task.title", undefined, "Task report")}
    >
      <CoverPage
        brand={brand}
        eyebrow={t("pdf.reports.task.eyebrow", undefined, "Task report")}
        title={project.name}
        subtitle={t("pdf.reports.task.countSubtitle", { count: tasks.length }, `${tasks.length} tasks`)}
      />
      <BrandedPage brand={brand} pageLabel={tasksWord}>
        <PdfTable
          columns={[
            { key: "title", label: t("pdf.reports.task.colTask", undefined, "Task"), width: 4 },
            { key: "status", label: t("pdf.reports.task.colStatus", undefined, "Status"), width: 1.5 },
            { key: "priority", label: t("pdf.reports.task.colPriority", undefined, "Priority"), width: 1.2 },
            { key: "assignee", label: t("pdf.reports.task.colAssignee", undefined, "Assignee"), width: 2 },
            { key: "due", label: t("pdf.reports.task.colDue", undefined, "Due"), width: 1.5 },
          ]}
          rows={tasks.map((t) => ({
            title: t.title,
            status: t.status ?? "",
            priority: t.priority ?? "",
            assignee: t.assignee_name ?? "",
            due: t.due_at ?? "",
          }))}
        />
      </BrandedPage>
    </PdfDocument>
  );
}

// ── #25 rental checkout / equipment pull sheet ─────────────────────

export function RentalPullSheetPdf({
  brand,
  t = identityT,
  rental,
  lineItems,
}: {
  brand: PdfBrand;
  t?: Translator;
  rental: { number: string; vendor_name: string | null; starts_on: string | null; ends_on: string | null };
  lineItems: Array<{ qty: number; item: string; serial?: string | null; note?: string | null }>;
}) {
  const pullSheetWord = t("pdf.reports.pullSheet.title", undefined, "Pull sheet");
  return (
    <PdfDocument
      title={`${pullSheetWord} ${rental.number}`}
      author={brand.producerName}
      subject={t("pdf.reports.pullSheet.subject", undefined, "Rental pull sheet")}
    >
      <CoverPage
        brand={brand}
        eyebrow={t("pdf.reports.pullSheet.eyebrow", undefined, "Rental · pull sheet")}
        title={`#${rental.number}`}
        subtitle={[
          rental.vendor_name,
          rental.starts_on && rental.ends_on ? `${rental.starts_on} → ${rental.ends_on}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      <BrandedPage
        brand={brand}
        pageLabel={t("pdf.reports.pullSheet.pageLabel", { number: rental.number }, `Rental ${rental.number}`)}
      >
        <PdfTable
          columns={[
            { key: "qty", label: t("pdf.reports.pullSheet.colQty", undefined, "Qty"), width: 0.7, align: "center" },
            { key: "item", label: t("pdf.reports.pullSheet.colItem", undefined, "Item"), width: 5 },
            { key: "serial", label: t("pdf.reports.pullSheet.colSerial", undefined, "Serial"), width: 2 },
            { key: "note", label: t("pdf.reports.pullSheet.colNote", undefined, "Note"), width: 2.5 },
          ]}
          rows={lineItems.map((li) => ({
            qty: String(li.qty),
            item: li.item,
            serial: li.serial ?? "",
            note: li.note ?? "",
          }))}
        />
      </BrandedPage>
    </PdfDocument>
  );
}

// ── #14 project signage grid ───────────────────────────────────────

export function SignageGridPdf({
  brand,
  t = identityT,
  project,
  entries,
}: {
  brand: PdfBrand;
  t?: Translator;
  project: { name: string };
  entries: Array<{
    location: string;
    type: string;
    size?: string | null;
    install?: string | null;
    strike?: string | null;
    note?: string | null;
  }>;
}) {
  const signageWord = t("pdf.reports.signage.signageWord", undefined, "Signage");
  const signageGridLabel = t("pdf.reports.signage.gridLabel", undefined, "Signage grid");
  return (
    <PdfDocument title={`${signageWord} · ${project.name}`} author={brand.producerName} subject={signageGridLabel}>
      <CoverPage
        brand={brand}
        eyebrow={signageGridLabel}
        title={project.name}
        subtitle={t(
          "pdf.reports.signage.countSubtitle",
          { count: entries.length },
          `${entries.length} signage locations`,
        )}
      />
      <BrandedPage brand={brand} pageLabel={signageGridLabel}>
        <PdfTable
          columns={[
            { key: "location", label: t("pdf.reports.signage.colLocation", undefined, "Location"), width: 3 },
            { key: "type", label: t("pdf.reports.signage.colType", undefined, "Type"), width: 2 },
            { key: "size", label: t("pdf.reports.signage.colSize", undefined, "Size"), width: 1.5 },
            { key: "install", label: t("pdf.reports.signage.colInstall", undefined, "Install"), width: 1.5 },
            { key: "strike", label: t("pdf.reports.signage.colStrike", undefined, "Strike"), width: 1.5 },
            { key: "note", label: t("pdf.reports.signage.colNote", undefined, "Note"), width: 2 },
          ]}
          rows={entries.map((e) => ({
            location: e.location,
            type: e.type,
            size: e.size ?? "",
            install: e.install ?? "",
            strike: e.strike ?? "",
            note: e.note ?? "",
          }))}
        />
      </BrandedPage>
    </PdfDocument>
  );
}
