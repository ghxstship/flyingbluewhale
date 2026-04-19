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

// ── #17 expense report ────────────────────────────────────────────

export function ExpenseReportPdf({
  brand,
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
  project: { name: string };
  rangeFrom: string;
  rangeTo: string;
  expenses: Array<{ description: string; category: string | null; date: string | null; amount_cents: number }>;
  time: Array<{ user_name: string | null; hours: number; rate_cents: number | null; date: string | null }>;
  mileage: Array<{ user_name: string | null; miles: number; rate_per_mile_cents: number | null; date: string | null }>;
  totalCents: number;
  currency: string;
}) {
  const money = (c: number) => {
    try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(c / 100); }
    catch { return `${currency} ${(c / 100).toFixed(2)}`; }
  };
  return (
    <PdfDocument title={`Expense report · ${project.name}`} author={brand.producerName} subject="Expense report">
      <CoverPage
        brand={brand}
        eyebrow="Expense report"
        title={project.name}
        subtitle={`${rangeFrom} → ${rangeTo} · Total ${money(totalCents)}`}
      />
      <BrandedPage brand={brand} pageLabel="Expense report">
        <SectionHeading title="Expenses" />
        <PdfTable
          columns={[
            { key: "date", label: "Date", width: 1.5 },
            { key: "description", label: "Description", width: 4 },
            { key: "category", label: "Category", width: 2 },
            { key: "amount", label: "Amount", width: 2, align: "right" },
          ]}
          rows={expenses.map((e) => ({
            date: e.date ?? "",
            description: e.description,
            category: e.category ?? "",
            amount: money(e.amount_cents),
          }))}
        />
        <SectionHeading title="Time entries" />
        <PdfTable
          columns={[
            { key: "date", label: "Date", width: 1.5 },
            { key: "user", label: "Member", width: 3 },
            { key: "hours", label: "Hours", width: 1, align: "right" },
            { key: "rate", label: "Rate", width: 2, align: "right" },
            { key: "amount", label: "Amount", width: 2, align: "right" },
          ]}
          rows={time.map((t) => ({
            date: t.date ?? "",
            user: t.user_name ?? "",
            hours: String(t.hours),
            rate: t.rate_cents != null ? money(t.rate_cents) : "",
            amount: t.rate_cents != null ? money(Math.round(t.hours * t.rate_cents)) : "",
          }))}
        />
        <SectionHeading title="Mileage" />
        <PdfTable
          columns={[
            { key: "date", label: "Date", width: 1.5 },
            { key: "user", label: "Member", width: 3 },
            { key: "miles", label: "Miles", width: 1, align: "right" },
            { key: "rate", label: "Rate/mi", width: 2, align: "right" },
            { key: "amount", label: "Amount", width: 2, align: "right" },
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
          Total — {money(totalCents)}
        </Text>
      </BrandedPage>
    </PdfDocument>
  );
}

// ── #24 task / punch-list report ──────────────────────────────────

export function TaskReportPdf({
  brand,
  project,
  tasks,
}: {
  brand: PdfBrand;
  project: { name: string };
  tasks: Array<{ title: string; status: string | null; priority: string | null; assignee_name: string | null; due_at: string | null }>;
}) {
  return (
    <PdfDocument title={`Tasks · ${project.name}`} author={brand.producerName} subject="Task report">
      <CoverPage brand={brand} eyebrow="Task report" title={project.name} subtitle={`${tasks.length} tasks`} />
      <BrandedPage brand={brand} pageLabel="Tasks">
        <PdfTable
          columns={[
            { key: "title", label: "Task", width: 4 },
            { key: "status", label: "Status", width: 1.5 },
            { key: "priority", label: "Priority", width: 1.2 },
            { key: "assignee", label: "Assignee", width: 2 },
            { key: "due", label: "Due", width: 1.5 },
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
  rental,
  lineItems,
}: {
  brand: PdfBrand;
  rental: { number: string; vendor_name: string | null; starts_on: string | null; ends_on: string | null };
  lineItems: Array<{ qty: number; item: string; serial?: string | null; note?: string | null }>;
}) {
  return (
    <PdfDocument title={`Pull sheet ${rental.number}`} author={brand.producerName} subject="Rental pull sheet">
      <CoverPage
        brand={brand}
        eyebrow="Rental · pull sheet"
        title={`#${rental.number}`}
        subtitle={[rental.vendor_name, rental.starts_on && rental.ends_on ? `${rental.starts_on} → ${rental.ends_on}` : null].filter(Boolean).join(" · ")}
      />
      <BrandedPage brand={brand} pageLabel={`Rental ${rental.number}`}>
        <PdfTable
          columns={[
            { key: "qty", label: "Qty", width: 0.7, align: "center" },
            { key: "item", label: "Item", width: 5 },
            { key: "serial", label: "Serial", width: 2 },
            { key: "note", label: "Note", width: 2.5 },
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
  project,
  entries,
}: {
  brand: PdfBrand;
  project: { name: string };
  entries: Array<{ location: string; type: string; size?: string | null; install?: string | null; strike?: string | null; note?: string | null }>;
}) {
  return (
    <PdfDocument title={`Signage · ${project.name}`} author={brand.producerName} subject="Signage grid">
      <CoverPage brand={brand} eyebrow="Signage grid" title={project.name} subtitle={`${entries.length} signage locations`} />
      <BrandedPage brand={brand} pageLabel="Signage grid">
        <PdfTable
          columns={[
            { key: "location", label: "Location", width: 3 },
            { key: "type", label: "Type", width: 2 },
            { key: "size", label: "Size", width: 1.5 },
            { key: "install", label: "Install", width: 1.5 },
            { key: "strike", label: "Strike", width: 1.5 },
            { key: "note", label: "Note", width: 2 },
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
