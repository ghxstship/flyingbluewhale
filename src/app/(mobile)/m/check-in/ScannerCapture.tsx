"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { bytesToBase64, imageFileToJpegPage, jpegPagesToPdf, type JpegPage } from "@/lib/mobile/image-pdf";
import { uploadPersonalDoc } from "@/components/workforce/docs-action";
import { importScanToBudget, parseScanCapture } from "./scanner-actions";

/**
 * COMPVSS · Scanner mode (kit 31, live-test resolutions #21/#22) — the
 * Document / Invoice / Receipt segment of the shared Scan surface.
 *
 * Document: multi-page camera capture → client-assembled PDF → the existing
 * personal-documents upload path (lands in /m/documents).
 *
 * Invoice / Receipt: capture → REAL AP-OCR parse (the studio pipeline) →
 * a confirm card (vendor / amount / date, all editable — the parse is a
 * draft, never a silent write) → cost-code select with an evidence-based
 * Auto suggestion → Import To Budget writes a real `expenses` row (or codes
 * the existing uncoded expense the caller arrived from).
 */

export type CostCodeOpt = { value: string; label: string };

export type ExpenseDraft = {
  id: string;
  vendor: string | null;
  amount: string;
  date: string | null;
};

type DocKind = "document" | "invoice" | "receipt";

type Draft = {
  parsed: boolean;
  vendor: string;
  amount: string;
  date: string;
  code: string;
  auto: boolean;
  receiptPath: string | null;
  /** Set when coding an existing uncoded expense instead of creating one. */
  expenseId?: string;
};

export function ScannerCapture({
  costCodes,
  canImportInvoice,
  initialKind,
  expenseDraft,
}: {
  costCodes: CostCodeOpt[];
  /** Manager band — the kit gates invoice capture on `approve`. */
  canImportInvoice: boolean;
  initialKind?: DocKind;
  /** Prefill from an existing uncoded expense (the Finance "Code It" row). */
  expenseDraft?: ExpenseDraft | null;
}) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [kind, setKind] = useState<DocKind>(initialKind ?? "document");
  const [pages, setPages] = useState<JpegPage[]>([]);
  const [draft, setDraft] = useState<Draft | null>(
    expenseDraft
      ? {
          parsed: false,
          vendor: expenseDraft.vendor ?? "",
          amount: expenseDraft.amount,
          date: expenseDraft.date ?? "",
          code: "",
          auto: false,
          receiptPath: null,
          expenseId: expenseDraft.id,
        }
      : null,
  );
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const kinds: Array<[DocKind, string, string]> = [
    ["document", t("m.scanner.document", undefined, "Document"), "FileText"],
    ...(canImportInvoice
      ? ([["invoice", t("m.scanner.invoice", undefined, "Invoice"), "ReceiptText"]] as Array<[DocKind, string, string]>)
      : []),
    ["receipt", t("m.scanner.receipt", undefined, "Receipt"), "Receipt"],
  ];

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const converted: JpegPage[] = [];
      for (const f of Array.from(files)) converted.push(await imageFileToJpegPage(f));

      if (kind === "document") {
        setPages((p) => [...p, ...converted]);
        toast.success(
          t("m.scanner.pageCaptured", { count: pages.length + converted.length }, `Page ${pages.length + converted.length} Captured`),
          { description: t("m.scanner.keepScanning", undefined, "Keep scanning or save as PDF.") },
        );
        return;
      }

      // Invoice / receipt: single capture → stored + parsed server-side.
      const pdf = jpegPagesToPdf(converted.slice(0, 1));
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("file_base64", bytesToBase64(pdf));
      const res = await parseScanCapture(fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setDraft((prev) => ({
        parsed: res.parsed ?? false,
        vendor: res.vendor ?? prev?.vendor ?? "",
        amount: res.amount ?? prev?.amount ?? "",
        date: res.date ?? prev?.date ?? "",
        code: res.suggestedCode ?? prev?.code ?? "",
        auto: !!res.suggestedCode,
        receiptPath: res.receiptPath ?? null,
        expenseId: prev?.expenseId,
      }));
      if (res.parsed) {
        toast.success(t("m.scanner.parsedTitle", undefined, "Capture Parsed"), {
          description: t("m.scanner.parsedBody", undefined, "Review the fields and the coding below."),
        });
      } else {
        toast.info(t("m.scanner.noParseTitle", undefined, "Captured, Not Parsed"), {
          description: t(
            "m.scanner.noParseBody",
            undefined,
            "The capture is saved. Enter the vendor, amount and date to import it.",
          ),
        });
      }
    } catch {
      toast.error(t("m.scanner.captureFailed", undefined, "Could not read that photo. Try again."));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const savePdf = () => {
    if (pages.length === 0 || pending) return;
    const pdf = jpegPagesToPdf(pages);
    const fd = new FormData();
    const stamp = new Date().toISOString().slice(0, 10);
    fd.set("file", new File([pdf as BlobPart], `scan-${Date.now()}.pdf`, { type: "application/pdf" }));
    fd.set("label", t("m.scanner.pdfLabel", { date: stamp }, `Scanned Document · ${stamp}`));
    fd.set("doc_kind", "other");
    fd.set("revalidate", "/m/documents");
    fd.set("redirectTo", "/m/documents");
    startTransition(async () => {
      // Redirects to /m/documents on success; only errors return.
      const res = await uploadPersonalDoc(null, fd);
      if (res?.error) toast.error(res.error);
    });
  };

  const importDraft = () => {
    if (!draft || pending) return;
    const fd = new FormData();
    fd.set("kind", kind === "receipt" ? "receipt" : "invoice");
    fd.set("vendor", draft.vendor);
    fd.set("amount", draft.amount);
    fd.set("date", draft.date);
    fd.set("code", draft.code);
    if (draft.receiptPath) fd.set("receiptPath", draft.receiptPath);
    if (draft.expenseId) fd.set("expenseId", draft.expenseId);
    startTransition(async () => {
      const res = await importScanToBudget(fd);
      if (res?.error) {
        const first = res.fieldErrors ? Object.values(res.fieldErrors)[0] : undefined;
        toast.error(first ?? res.error);
        return;
      }
      setDraft(null);
      toast.success(t("m.scanner.importedTitle", undefined, "Imported To Budget"), {
        description: draft.code
          ? t("m.scanner.importedBody", { code: draft.code }, `${draft.code} · managed in ATLVS`)
          : t("m.scanner.importedUncoded", undefined, "Saved uncoded. Finance can code it later."),
      });
      if (draft.expenseId) router.push("/m/finance");
      else router.refresh();
    });
  };

  return (
    <>
      <div className="seg2" style={{ marginBottom: 14, display: "grid", gridTemplateColumns: `repeat(${kinds.length}, 1fr)` }}>
        {kinds.map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            className={kind === id ? "on" : ""}
            onClick={() => {
              setKind(id);
              setPages([]);
              if (!expenseDraft) setDraft(null);
            }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
          >
            <KIcon name={icon} size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Camera capture input — rear camera directly on device. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={kind === "document"}
        style={{ display: "none" }}
        onChange={(e) => void onFiles(e.target.files)}
      />
      <button
        type="button"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center" }}
        disabled={busy || pending}
        onClick={() => fileRef.current?.click()}
      >
        <KIcon name="ScanLine" size={16} />{" "}
        {busy
          ? t("m.scanner.working", undefined, "Working…")
          : kind === "document" && pages.length > 0
            ? t("m.scanner.captureNext", { page: pages.length + 1 }, `Capture Page · ${pages.length + 1}`)
            : t("m.scanner.capture", undefined, "Capture Page")}
      </button>
      <div className="scanhint">
        <KIcon name="Camera" size={14} />{" "}
        {kind === "document"
          ? t("m.scanner.hintDocument", undefined, "Multi-page: capture each page, then save as one PDF.")
          : t("m.scanner.hintSpend", undefined, "Frame the whole page. Parsed fields stay editable before import.")}
      </div>

      {/* Document mode: assembled PDF row. */}
      {kind === "document" && pages.length > 0 && (
        <div className="item" style={{ marginTop: 10, alignItems: "center" }}>
          <span className="cart-thumb" style={{ width: 40, height: 40 }}>
            <KIcon name="FileStack" size={17} style={{ color: "var(--p-text-3)" }} />
          </span>
          <div style={{ flex: 1 }}>
            <div className="t">{t("m.scanner.untitled", undefined, "Untitled Scan")}</div>
            <div className="s">{t("m.scanner.pagesPdf", { count: pages.length }, `${pages.length} Pages · PDF`)}</div>
          </div>
          <button type="button" className="ps-btn ps-btn--cta ps-btn--sm" disabled={pending} onClick={savePdf}>
            {pending ? t("m.scanner.saving", undefined, "Saving…") : t("m.scanner.savePdf", undefined, "Save PDF")}
          </button>
        </div>
      )}

      {/* Invoice / receipt confirm card. */}
      {kind !== "document" && draft && (
        <div
          className="item"
          style={{ display: "block", marginTop: 10, borderColor: "color-mix(in oklab, var(--p-success) 40%, var(--p-border))" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span className="cart-thumb" style={{ width: 40, height: 40 }}>
              <KIcon name="ReceiptText" size={17} style={{ color: "var(--p-text-3)" }} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">
                {draft.expenseId
                  ? t("m.scanner.codeExisting", undefined, "Code This Spend")
                  : draft.parsed
                    ? t("m.scanner.parsedFrom", undefined, "Parsed From Scan")
                    : t("m.scanner.manualEntry", undefined, "Confirm The Details")}
              </div>
              <div className="s">
                {draft.parsed
                  ? t("m.scanner.confirmHint", undefined, "Check every field before importing.")
                  : t("m.scanner.typeHint", undefined, "Type the details from the page.")}
              </div>
            </div>
            <span className={`ps-badge ${draft.parsed ? "ps-badge--ok" : "ps-badge--neutral"}`}>
              {draft.parsed ? t("m.scanner.parsedBadge", undefined, "Parsed") : t("m.scanner.manualBadge", undefined, "Manual")}
            </span>
          </div>

          <div className="fld">
            <label className="wl">{t("m.scanner.vendor", undefined, "Vendor")}</label>
            <input
              className="ps-input"
              value={draft.vendor}
              onChange={(e) => setDraft((d) => (d ? { ...d, vendor: e.target.value } : d))}
              placeholder={t("m.scanner.vendorPh", undefined, "Who was paid?")}
              readOnly={!!draft.expenseId}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="fld">
              <label className="wl">{t("m.scanner.amount", undefined, "Amount (USD)")}</label>
              <input
                className="ps-input"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => setDraft((d) => (d ? { ...d, amount: e.target.value } : d))}
                placeholder="0.00"
                readOnly={!!draft.expenseId}
              />
            </div>
            <div className="fld">
              <label className="wl">{t("m.scanner.date", undefined, "Date")}</label>
              <input
                className="ps-input"
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((d) => (d ? { ...d, date: e.target.value } : d))}
                style={{ minWidth: 0, appearance: "none", minHeight: 44 }}
                readOnly={!!draft.expenseId}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span className="wl" style={{ flex: "none" }}>
              {t("m.scanner.costCode", undefined, "Cost Code")}
            </span>
            <select
              className="ps-input"
              style={{ flex: 1 }}
              value={draft.code}
              onChange={(e) => setDraft((d) => (d ? { ...d, code: e.target.value, auto: false } : d))}
            >
              <option value="">{t("m.scanner.codeNone", undefined, "Uncoded")}</option>
              {costCodes.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="ps-badge ps-badge--neutral">
              {draft.auto ? t("m.scanner.autoCoded", undefined, "Auto-Coded") : t("m.scanner.manualCoded", undefined, "Manual")}
            </span>
          </div>

          <button
            type="button"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={pending}
            onClick={importDraft}
          >
            <KIcon name="ArrowDownToLine" size={16} />{" "}
            {pending
              ? t("m.scanner.importing", undefined, "Importing…")
              : t("m.scanner.importToBudget", undefined, "Import To Budget")}
          </button>
        </div>
      )}
    </>
  );
}
