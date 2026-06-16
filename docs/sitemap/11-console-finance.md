# ATLVS Console — Finance & Procurement

Page inventory for the `/console` platform shell, scoped to the `finance`, `subscriptions`, `procurement`, `contracts`, and `submittals` segments. One bullet per route (dynamic detail/new/edit collapsed under their parent). CRUD/interactive notes reflect what each `page.tsx` (and sibling `actions.ts`) actually wires up.

## Finance

- `/console/finance` — Finance hub: AR/AP, budgets, and reporting at a glance. **CRUD/interactive:** read-only (two streamed MetricCard grids: outstanding/paid/expenses/budget-total + counts; sub-module tiles link out).
- `/console/finance/ap-ocr` — AP Invoice OCR queue: upload vendor invoice PDFs, auto-extract, and promote to invoices. **CRUD/interactive:** DataTable (state-filtered list, rowHref to extraction), client file-upload form (`uploadAndExtract`, PDF only) with extraction confidence/state machine (queued→extracting→extracted→review→matched→promoted/rejected/failed), MetricCards.
- `/console/finance/budgets` — Budget register. **CRUD/interactive:** DataTable (filter, rowHref to detail), link to `/new`, link to `/import`.
  - `/console/finance/budgets/new` — Create budget. **CRUD/interactive:** create form (`"use server"` action).
  - `/console/finance/budgets/import` — Paste-import budget rows from CSV/TSV (XPMS Universal Budget Template). **CRUD/interactive:** client bulk-import form (`ImportBudgetForm`, header auto-detection).
  - `/console/finance/budgets/[budgetId]` — Budget detail. **CRUD/interactive:** reconcile action (form), edit link, DeleteForm.
  - `/console/finance/budgets/[budgetId]/edit` — Edit budget. **CRUD/interactive:** update FormShell.
  - `/console/finance/budgets/summary` — Budget summary rollups by department/XPMS class. **CRUD/interactive:** read-only (aggregate tables, filters).
- `/console/finance/cost-codes` — Master cost-code list. **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/finance/cost-codes/new` — Create cost code. **CRUD/interactive:** create FormShell.
- `/console/finance/entities` — Legal entities register. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/finance/entities/new` — Create legal entity. **CRUD/interactive:** create FormShell.
  - `/console/finance/entities/[id]` — Entity detail. **CRUD/interactive:** read-only (MetricCards, filters).
- `/console/finance/consolidation` — Multi-entity FX consolidation. **CRUD/interactive:** read-only dashboard (MetricCards, EmptyState, references `POST /api/v1/integrations/fx/refresh` and links to create entities).
- `/console/finance/expenses` — Expense register. **CRUD/interactive:** DataTable (filter, rowHref), StatusBadge, link to `/new`.
  - `/console/finance/expenses/new` — Log expense. **CRUD/interactive:** create form.
  - `/console/finance/expenses/[expenseId]` — Expense detail. **CRUD/interactive:** StatusBadge, edit link, DeleteForm.
  - `/console/finance/expenses/[expenseId]/edit` — Edit expense. **CRUD/interactive:** update FormShell.
- `/console/finance/forecasts` — EAC forecasts. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/finance/forecasts/new` — Create EAC forecast. **CRUD/interactive:** create FormShell.
- `/console/finance/invoices` — Invoice register. **CRUD/interactive:** DataTable (filter, rowHref), StatusBadge, link to `/new`.
  - `/console/finance/invoices/new` — Create invoice. **CRUD/interactive:** create form.
  - `/console/finance/invoices/[invoiceId]` — Invoice detail. **CRUD/interactive:** StatusBadge, PDF DownloadLink (`/api/v1/invoices/[id]/pdf`), document-view link, edit link, DeleteForm.
  - `/console/finance/invoices/[invoiceId]/edit` — Edit invoice. **CRUD/interactive:** update FormShell.
  - `/console/finance/invoices/[invoiceId]/line-items` — Invoice line items. **CRUD/interactive:** DataTable.
  - `/console/finance/invoices/[invoiceId]/activity` — Invoice audit trail. **CRUD/interactive:** read-only DataTable (filter).
- `/console/finance/lien-waivers` — Lien waiver register. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/finance/lien-waivers/new` — Create lien waiver. **CRUD/interactive:** create FormShell.
  - `/console/finance/lien-waivers/[id]` — Lien waiver detail with e-sign lifecycle (drafted→sent→signed→returned→released/voided). **CRUD/interactive:** send action, record-signature form (signer name/title), mark-returned, release, void (reason) — each a server-action form; linked pay-app.
- `/console/finance/mileage` — Mileage log. **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/finance/mileage/new` — Log mileage. **CRUD/interactive:** create form.
  - `/console/finance/mileage/[mileageId]` — Mileage detail. **CRUD/interactive:** DeleteForm.
  - `/console/finance/mileage/[mileageId]/edit` — Edit mileage. **CRUD/interactive:** update FormShell.
- `/console/finance/pay-apps` — Pay applications register. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/finance/pay-apps/new` — Create pay application. **CRUD/interactive:** create FormShell.
  - `/console/finance/pay-apps/[id]` — Pay app detail with state machine. **CRUD/interactive:** PDF download (`/api/v1/pay-apps/[id]/pdf`, signed URL), transition controls (submit/approve/reject/paid via `transitionPayApp`), inline per-line edit forms (`updatePayAppLine`).
- `/console/finance/payouts` — Stripe Connect onboarding status per vendor. **CRUD/interactive:** read-only DataTable (Connect account column).
- `/console/finance/payroll` — Certified payroll runs. **CRUD/interactive:** DataTable (filter), MetricCards, per-row PDF + state-XML DownloadLinks (`/api/v1/payroll-runs/[id]/pdf`, `/state-xml`), link to `/new`.
  - `/console/finance/payroll/new` — Create payroll run. **CRUD/interactive:** create FormShell.
- `/console/finance/periods` — Accounting periods. **CRUD/interactive:** DataTable (filter, rowHref), link to `/new`.
  - `/console/finance/periods/new` — Open accounting period (month/quarter/fiscal). **CRUD/interactive:** create FormShell.
  - `/console/finance/periods/[periodId]` — Period detail with recent state transitions. **CRUD/interactive:** read-only (transition journal preview, link to full transitions log).
  - `/console/finance/periods/[periodId]/transitions` — Append-only state-transition log. **CRUD/interactive:** read-only table.
- `/console/finance/reports` — Live P&L / financial reports from current books. **CRUD/interactive:** read-only (MetricCards, AR-aging table).
- `/console/finance/time` — Time tracking entries. **CRUD/interactive:** DataTable (rowHref, searchParams filter), link to `/new`.
  - `/console/finance/time/new` — Log time. **CRUD/interactive:** create form.
  - `/console/finance/time/[entryId]` — Time entry detail. **CRUD/interactive:** DeleteForm.
  - `/console/finance/time/[entryId]/edit` — Edit time entry. **CRUD/interactive:** update FormShell.
- `/console/finance/timesheets` — Timesheets register. **CRUD/interactive:** DataTable (filter, rowHref), StatusBadge.
  - `/console/finance/timesheets/[id]` — Timesheet detail with approvals. **CRUD/interactive:** read-only (StatusBadge, per-approver decision list).
- `/console/finance/treasury` — Cash position, receivables, payables. **CRUD/interactive:** read-only (MetricCards, EmptyState, filter).
- `/console/finance/wip` — Work-in-progress (WIP) snapshots per project. **CRUD/interactive:** DataTable (filter), MetricCards, generate-snapshots action (`generateOrgWipSnapshots` form), snapshot PDF DownloadLink (`/api/v1/wip/snapshot-pdf`), link to `/new`.

## Subscriptions

- `/console/subscriptions` — Recurring subscriptions (members, retainers, sponsors). **CRUD/interactive:** DataTable (filter, rowHref), link to `/new`.
  - `/console/subscriptions/new` — Create subscription. **CRUD/interactive:** create FormShell.
  - `/console/subscriptions/[subscriptionId]` — Subscription detail with recent state transitions. **CRUD/interactive:** read-only (transition journal preview, link to full transitions log).
  - `/console/subscriptions/[subscriptionId]/transitions` — Append-only state-transition log (incl. Stripe event column). **CRUD/interactive:** read-only table.

## Procurement

- `/console/procurement` — Procurement hub (vendors, requisitions, POs). **CRUD/interactive:** read-only (MetricCards + sub-module tiles).
- `/console/procurement/catalog` — Approved item catalog. **CRUD/interactive:** read-only (EmptyState; list view).
- `/console/procurement/itb` — Invitations to Bid (ITB phase tracking). **CRUD/interactive:** DataTable (filter, rowHref to RFQ detail), MetricCards, link to create RFQ.
- `/console/procurement/po-change-orders` — PO change orders register. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/procurement/po-change-orders/new` — Create PO change order. **CRUD/interactive:** create FormShell.
  - `/console/procurement/po-change-orders/[id]` — Change-order detail with approval state machine. **CRUD/interactive:** transition controls (submit/approve/reject via `transitionPoChangeOrder`), add-line form (`addCoLine`) + delete-line (`deleteCoLine`); lines lock once in review/approved/rejected/void.
- `/console/procurement/prequalification` — Vendor prequalification pipeline. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, links to invite-vendor `/new` and `/questionnaires/new`.
  - `/console/procurement/prequalification/new` — Invite vendor to prequalify. **CRUD/interactive:** create FormShell.
  - `/console/procurement/prequalification/questionnaires` — Prequal questionnaires. **CRUD/interactive:** DataTable (rowHref), link to `/new`.
  - `/console/procurement/prequalification/questionnaires/new` — Create questionnaire. **CRUD/interactive:** create FormShell.
- `/console/procurement/purchase-orders` — Purchase orders register. **CRUD/interactive:** DataTable (filter, rowHref), StatusBadge, link to `/new`.
  - `/console/procurement/purchase-orders/new` — Create purchase order. **CRUD/interactive:** create form.
  - `/console/procurement/purchase-orders/[poId]` — PO detail. **CRUD/interactive:** StatusBadge, edit link, DeleteForm.
  - `/console/procurement/purchase-orders/[poId]/edit` — Edit PO. **CRUD/interactive:** update FormShell.
  - `/console/procurement/purchase-orders/[poId]/checklist` — PO closeout checklist. **CRUD/interactive:** complete-item / skip-item forms (`completeChecklistItem`, `skipChecklistItem`), add-item form (`addChecklistItem`), filter.
- `/console/procurement/requisitions` — Requisitions register. **CRUD/interactive:** DataTable (filter, rowHref), StatusBadge, link to `/new`.
  - `/console/procurement/requisitions/new` — Create requisition. **CRUD/interactive:** create form.
  - `/console/procurement/requisitions/[reqId]` — Requisition detail. **CRUD/interactive:** edit link, DeleteForm.
  - `/console/procurement/requisitions/[reqId]/edit` — Edit requisition. **CRUD/interactive:** update FormShell.
  - `/console/procurement/requisitions/[reqId]/leveling` — Bid leveling / comparison. **CRUD/interactive:** DataTable (filter), award-response form per row (`awardResponse`).
  - `/console/procurement/requisitions/[reqId]/leveling/new` — Add bid response. **CRUD/interactive:** create FormShell.
- `/console/procurement/rfqs` — RFQs register. **CRUD/interactive:** DataTable (filter, rowHref into requisitions), MetricCards, link to create requisition.
  - `/console/procurement/rfqs/new` — Create RFQ. **CRUD/interactive:** create FormShell.
  - `/console/procurement/rfqs/[rfqId]` — RFQ detail with responses summary. **CRUD/interactive:** read-only (StatusBadge, MetricCards incl. lowest-bid, response list, link to requisitions).
  - `/console/procurement/rfqs/[rfqId]/publish` — Publish RFQ to the public marketplace. **CRUD/interactive:** publish FormShell.
  - `/console/procurement/rfqs/[rfqId]/responses` — RFQ responses list. **CRUD/interactive:** DataTable (filter), MetricCards.
  - `/console/procurement/rfqs/[rfqId]/responses/[responseId]` — Response detail with line items. **CRUD/interactive:** MetricCards, add-line form (`addResponseLine`), delete-line (`deleteResponseLine`).
- `/console/procurement/scorecards` — Supplier scorecards overview. **CRUD/interactive:** read-only (MetricCards, EmptyState, link to vendors).
- `/console/procurement/sourcing` — Sourcing overview (requisition→PO conversion funnel). **CRUD/interactive:** read-only (MetricCards, EmptyState, link to create requisition).
- `/console/procurement/vendors` — Vendors register. **CRUD/interactive:** DataTable (filter, rowHref), link to `/new`.
  - `/console/procurement/vendors/new` — Create vendor. **CRUD/interactive:** create form.
  - `/console/procurement/vendors/[vendorId]` — Vendor detail. **CRUD/interactive:** edit link, DeleteForm.
  - `/console/procurement/vendors/[vendorId]/edit` — Edit vendor. **CRUD/interactive:** update FormShell.
  - `/console/procurement/vendors/[vendorId]/onboarding` — Vendor onboarding checklist (required-item progress). **CRUD/interactive:** read-only (item-state progress view, filter).
  - `/console/procurement/vendors/[vendorId]/pos` — Vendor's purchase orders. **CRUD/interactive:** read-only DataTable (filter, rowHref), StatusBadge.
  - `/console/procurement/vendors/[vendorId]/prequalification` — Vendor prequalification submissions. **CRUD/interactive:** DataTable (filter, rowHref).
  - `/console/procurement/vendors/[vendorId]/prequalification/[prequalId]` — Prequal submission detail. **CRUD/interactive:** read-only (MetricCards, signed-URL attachment download links via `procore-parity` storage).
  - `/console/procurement/vendors/[vendorId]/scorecard` — Per-vendor scorecard. **CRUD/interactive:** read-only (MetricCards, submittal-rate stats, EmptyState).
  - `/console/procurement/vendors/[vendorId]/submittals` — Vendor's submittals. **CRUD/interactive:** read-only DataTable (filter, rowHref), StatusBadge.
- `/console/procurement/wo-broadcasts` — Work-order broadcasts register. **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/procurement/wo-broadcasts/new` — Create WO broadcast. **CRUD/interactive:** create FormShell.
  - `/console/procurement/wo-broadcasts/[broadcastId]` — Broadcast detail with vendor invites. **CRUD/interactive:** transition controls (`transitionBroadcast`), invite-vendor form (`inviteVendor`), award-to-invite (`awardToInvite`), remove-invite (`removeInvite`), MetricCards, filter.

## Contracts

- `/console/contracts` — Contracts register. **CRUD/interactive:** DataTable (filter, rowHref to `/console/contracts/[id]`), MetricCards, link to `/console/contracts/new`. _(Note: the referenced `/new` and `/[id]` detail routes have no `page.tsx` under this segment — only the list page exists here.)_

## Submittals

- `/console/submittals` — Submittals register (vendor packages with stamps + revision rounds). **CRUD/interactive:** DataTable (filter, rowHref), MetricCards, link to `/new`.
  - `/console/submittals/new` — Create submittal register entry. **CRUD/interactive:** create FormShell.
  - `/console/submittals/[id]` — Submittal detail with revision rounds. **CRUD/interactive:** stamp-revision form (`stampRevision` — approved / approved-with-comments / revise-resubmit / rejected + notes), add-next-round (`addNextRound`), close-submittal (`closeSubmittal`).
  - `/console/submittals/[id]/edit` — Edit submittal (title, status, vendor, ball-in-court). **CRUD/interactive:** update FormShell.
