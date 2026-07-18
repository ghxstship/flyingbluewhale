import { can, isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { CATALOG_KIND_LABEL_SINGULAR, type CatalogKind } from "@/lib/db/assignments";
import { CheckInScanner, type RecentScan } from "./CheckInScanner";
import type { BindableCatalogItem } from "./ProductMatchCard";
import type { CostCodeOpt, ExpenseDraft } from "./ScannerCapture";
import { WillSyncChip } from "@/components/mobile/WillSyncChip";

/**
 * The ONE shared Scan surface (kit 29 §C route policy, directive 2026-07-17).
 *
 * `/m/check-in` is the canonical route; `/m/scan` is an alias rendering this
 * same surface; `/m/inventory/scan` renders it preset to the Asset (inventory)
 * mode; `/m/check-in/scan/[slug]` renders it scoped to a gate slug. Before the
 * consolidation, `/m/scan` and `/m/inventory/scan` were divergent duplicates
 * (a separate QuickScan capture log and a mode-locked InventoryScanner copy).
 *
 * Segmented Access / Asset / POS scanner (live camera decode, per-mode
 * symbologies) with a manual code fallback (also the HID keyboard-wedge input
 * for Bluetooth sleds), both submitting through the queueable /api/v1/scan
 * endpoint (offline scans queue + replay). Recent activity is the org's
 * latest `assignment_events` scan rows.
 */

export type ScanSurfaceMode = "access" | "asset" | "pos" | "scanner";

/**
 * Normalize a `?mode=` deep-link value onto a segmented scanner mode.
 * `inventory` is the §C-sanctioned spelling for the Asset preset
 * (`/m/check-in?mode=inventory`); `scanner` is the kit 31 document/invoice/
 * receipt capture segment; anything unrecognized falls back to the default
 * Access segment.
 */
export function parseScanMode(raw: string | string[] | undefined): ScanSurfaceMode | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "access" || v === "asset" || v === "pos" || v === "scanner") return v;
  if (v === "inventory") return "asset";
  return undefined;
}

/** Normalize the `?kind=` deep link for the Scanner segment. */
export function parseScannerKind(raw: string | string[] | undefined): "document" | "invoice" | "receipt" | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "document" || v === "invoice" || v === "receipt") return v;
  return undefined;
}

export async function ScanSurface({
  initialMode,
  gateSlug,
  backHref,
  backLabel,
  scannerKind,
  expenseId,
}: {
  /** Preset segment (deep-link or preset route); defaults to Access. */
  initialMode?: ScanSurfaceMode;
  /** Gate / zone slug context (`/m/check-in/scan/[slug]`). */
  gateSlug?: string;
  /** Optional back link (the Inventory preset points back to /m/inventory). */
  backHref?: string;
  backLabel?: string;
  /** Scanner-segment preset (kit 31): document / invoice / receipt. */
  scannerKind?: "document" | "invoice" | "receipt";
  /** Code an existing uncoded expense (the Finance "Code It" deep link). */
  expenseId?: string;
}) {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("assignment_events")
    .select("id, result, body, at")
    .eq("org_id", session.orgId)
    .eq("event_kind", "scan")
    .order("at", { ascending: false })
    .limit(8);

  // POS product-match affordances (kit 30). Fulfillment confirmation mirrors
  // the advancing transition actions (manager+); binding an unknown GTIN is
  // the `people:manage` band, matching the catalog_item_gtins RLS write
  // policy. The bind picker's catalog list is only fetched when it can render.
  const canFulfill = isManagerPlus(session);
  const canBind = canFulfill || can(session, "people:manage");
  // Custody band mirrors transitionAssetState's own gate (manager+ OR the
  // `asset:custody` grant) so the quick-look drawer never offers a button
  // the server would bounce.
  const canMoveCustody = canFulfill || can(session, "asset:custody");
  let catalogItems: BindableCatalogItem[] = [];
  if (canBind) {
    const { data: items } = await supabase
      .from("master_catalog_items")
      .select("id, name, kind")
      .eq("org_id", session.orgId)
      .eq("active", true)
      .is("deleted_at", null)
      .order("name")
      .limit(300);
    catalogItems = ((items ?? []) as Array<{ id: string; name: string; kind: string }>).map((i) => ({
      id: i.id,
      label: `${CATALOG_KIND_LABEL_SINGULAR[i.kind as CatalogKind] ?? i.kind} · ${i.name}`,
    }));
  }

  // Scanner segment (kit 31 resolutions #21/#22): real cost-code options —
  // the org's cost centers plus every department already carried by budget
  // lines (the strings `expenses.department` stores). Plus, when the caller
  // arrived from a Finance "Code It" row, the uncoded expense as a draft.
  const [{ data: ccRows }, { data: deptRows }] = await Promise.all([
    supabase.from("cost_centers").select("code, name").eq("org_id", session.orgId).eq("active", true).order("code").limit(50),
    supabase.from("budgets").select("department").eq("org_id", session.orgId).not("department", "is", null).limit(500),
  ]);
  const codeSet = new Map<string, string>();
  for (const r of (deptRows ?? []) as Array<{ department: string | null }>) {
    if (r.department) codeSet.set(r.department, r.department);
  }
  for (const r of (ccRows ?? []) as Array<{ code: string; name: string }>) {
    const label = `${r.code} · ${r.name}`;
    if (!codeSet.has(label)) codeSet.set(label, label);
  }
  const costCodes: CostCodeOpt[] = Array.from(codeSet.keys())
    .sort()
    .map((v) => ({ value: v, label: v }));

  let expenseDraft: ExpenseDraft | null = null;
  if (expenseId && /^[0-9a-f-]{36}$/i.test(expenseId) && isManagerPlus(session)) {
    const { data: exp } = await supabase
      .from("expenses")
      .select("id, vendor, description, amount_cents, spent_at")
      .eq("id", expenseId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    const e = exp as { id: string; vendor: string | null; description: string; amount_cents: number; spent_at: string } | null;
    if (e) {
      expenseDraft = {
        id: e.id,
        vendor: e.vendor ?? e.description,
        amount: (e.amount_cents / 100).toFixed(2),
        date: e.spent_at,
      };
    }
  }

  const recent: RecentScan[] = (
    (data ?? []) as Array<{
      id: string;
      result: string | null;
      body: string | null;
      at: string | null;
    }>
  ).map((r) => ({
    id: r.id,
    result: r.result ?? "accepted",
    body: r.body,
    at: r.at ? fmt.relative(r.at) : "",
  }));

  return (
    <div className="screen screen-anim">
      {/* Kit 32 B2: scans queued in the durable outbox while offline —
          honest count read straight from the queue store. */}
      <WillSyncChip
        endpoints={["/api/v1/scan", "/api/v1/shifts/checkin", "/api/v1/accreditation/scan", "/api/v1/equipment/scan"]}
        align="center"
      />
      <CheckInScanner
        recent={recent}
        gateSlug={gateSlug}
        initialMode={initialMode}
        backHref={backHref}
        backLabel={backLabel}
        canFulfill={canFulfill}
        canBind={canBind}
        canMoveCustody={canMoveCustody}
        catalogItems={catalogItems}
        scannerProps={{
          costCodes,
          canImportInvoice: canFulfill,
          initialKind: expenseDraft ? "invoice" : scannerKind,
          expenseDraft,
        }}
        productLabels={{
          match: t("m.checkin.product.match", undefined, "Match"),
          matchedCatalog: t("m.checkin.product.matchedCatalog", undefined, "Matched Catalog"),
          approved: t("m.checkin.product.approved", undefined, "Approved"),
          fulfilled: t("m.checkin.product.fulfilled", undefined, "Fulfilled"),
          confirm: t("m.checkin.product.confirm", undefined, "Confirm Fulfillment"),
          confirming: t("m.checkin.product.confirming", undefined, "Confirming…"),
          confirmed: t("m.checkin.product.confirmed", undefined, "Fulfillment Confirmed"),
          noLines: t("m.checkin.product.noLines", undefined, "No Open Advance Lines For This Item"),
          bindHint: t(
            "m.checkin.product.bindHint",
            undefined,
            "Unknown product code. Bind it to a catalog item so the next scan resolves.",
          ),
          bindItemLabel: t("m.checkin.product.bindItemLabel", undefined, "Catalog Item"),
          bindSearchPlaceholder: t("m.checkin.product.bindSearch", undefined, "Search The Catalog…"),
          bindEmpty: t("m.checkin.product.bindEmpty", undefined, "No Catalog Items Match"),
          bindCta: t("m.checkin.product.bindCta", undefined, "Bind To Catalog Item"),
          binding: t("m.checkin.product.binding", undefined, "Binding…"),
          bound: t("m.checkin.product.bound", undefined, "Bound, Scan It Again To Resolve"),
        }}
        labels={{
          eyebrow: gateSlug
            ? t("m.checkin.gate.eyebrow", { slug: gateSlug }, `Gate · ${gateSlug}`)
            : t("m.checkin.eyebrow", { count: recent.length }, `${recent.length} Recent Scans`),
          title: t("m.checkin.title", undefined, "Scan"),
          access: t("m.checkin.access", undefined, "Access"),
          asset: t("m.checkin.asset", undefined, "Asset"),
          pos: t("m.checkin.pos", undefined, "POS"),
          scanner: t("m.checkin.scanner", undefined, "Scanner"),
          qr: t("m.checkin.qr", undefined, "QR Code"),
          scanHintCamera: t("m.checkin.scanHintCamera", undefined, "Reads QR & barcodes automatically"),
          scanHintAccess: t("m.checkin.scanHintAccess", undefined, "Scan the QR on the credential"),
          enableCamera: t("m.checkin.enableCamera", undefined, "Enable Camera"),
          cameraDenied: t("m.checkin.cameraDenied", undefined, "Camera Unavailable, Use Manual Entry"),
          queuedTitle: t("m.checkin.queuedTitle", undefined, "Recorded"),
          queuedBody: t(
            "m.checkin.queuedBody",
            undefined,
            "Saved on this device. It will sync and verify when you're back online.",
          ),
          ctaAccess: t("m.checkin.ctaAccess", undefined, "Verify Credential"),
          ctaAsset: t("m.checkin.ctaAsset", undefined, "Check Out / In"),
          ctaPos: t("m.checkin.ctaPos", undefined, "Scan Product"),
          manual: t("m.checkin.manual", undefined, "Enter Code Manually"),
          manualLabel: t("m.checkin.manualLabel", undefined, "Code"),
          manualPlaceholder: t("m.checkin.manualPlaceholder", undefined, "e.g. R7-014"),
          batch: t("m.checkin.batch", undefined, "Batch Check-In"),
          scanning: t("m.checkin.scanning", undefined, "Checking…"),
          recentTitle: t("m.checkin.recentTitle", undefined, "Recent Activity"),
          recentEmpty: t("m.checkin.recentEmpty", undefined, "No Scans Yet"),
          logged: t("m.checkin.logged", undefined, "Logged"),
        }}
      />
    </div>
  );
}
