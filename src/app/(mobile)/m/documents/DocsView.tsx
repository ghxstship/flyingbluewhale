"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  KIcon,
  NormalizedList,
  ScreenHeader,
  SheetHead,
  SwipeRow,
  type FieldDef,
} from "@/components/mobile/kit";
import { useDismissable } from "@/components/mobile/kit/useDismissable";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { DocDownloadLink } from "./DocDownloadLink";
import { signDocumentUrl, submitDeliverableFile, type SubmitFileState } from "./actions";

export type DocScope = "All" | "Team" | "Role" | "You" | "Restricted";

export type DocVerification = "unverified" | "pending_review" | "verified" | "rejected";

export type DocItem = {
  id: string;
  title: string;
  cat: string;
  scope: DocScope;
  kind: "deliverable" | "personal";
  downloadable: boolean;
  /** Deliverables only: the caller may (re)submit a file (own row, draft/revision_requested). */
  submittable?: boolean;
  /** Personal docs only: expiry date (yyyy-mm-dd) if the document lapses. */
  validUntil?: string | null;
  /** Personal docs only: office-side verification lifecycle. */
  verification?: DocVerification;
  updated: string | null;
};

/** null = no expiry; otherwise whole days until (negative = lapsed). Stable per render. */
function daysUntil(dateStr: string | null | undefined, now: number): number | null {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`).getTime();
  if (Number.isNaN(target)) return null;
  return Math.floor((target - now) / 86_400_000);
}

/**
 * Offline-capable viewer bytes (same pattern as /m/plans): signed URLs
 * expire in minutes so caching by URL never hits — fetch the bytes, stash
 * them in Cache Storage under a stable per-document key, and fall back to
 * the cached copy when the network (or the signer) is unreachable. Returns
 * an object URL for the iframe plus whether it came from cache.
 */
const DOC_CACHE = "atlvs-docs-v1";

async function fetchViewerBlob(cacheId: string, url: string): Promise<{ objectUrl: string; fromCache: boolean }> {
  const cacheKey = `/__doc-cache/${cacheId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const blob = await res.blob();
    try {
      const cache = await caches.open(DOC_CACHE);
      await cache.put(cacheKey, new Response(blob.slice(0), { headers: { "Content-Type": blob.type || "application/octet-stream" } }));
    } catch {
      // Cache Storage unavailable (private mode, quota) — viewing still works.
    }
    return { objectUrl: URL.createObjectURL(blob), fromCache: false };
  } catch (err) {
    const cache = await caches.open(DOC_CACHE);
    const hit = await cache.match(cacheKey);
    if (!hit) throw err;
    return { objectUrl: URL.createObjectURL(await hit.blob()), fromCache: true };
  }
}

const SCOPE_TONE: Record<DocScope, string> = {
  All: "neutral",
  Team: "info",
  Role: "warn",
  You: "ok",
  Restricted: "danger",
};

const SCOPES: DocScope[] = ["All", "Team", "Role", "You", "Restricted"];

function badgeClass(tone: string) {
  return `ps-badge ps-badge--${tone}`;
}

/**
 * Inline (re)submission form for the viewer sheet — the field half of the
 * deliverable loop. Rendered only when the server said the row is open to
 * this caller (own row, draft/revision_requested); the action re-checks.
 */
function SubmitFileForm({ doc, onDone }: { doc: DocItem; onDone: () => void }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<SubmitFileState, FormData>(submitDeliverableFile, null);

  useEffect(() => {
    if (state?.ok) onDone();
    // onDone identity changes per render; keying on state is the intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} encType="multipart/form-data" style={{ marginBottom: 12 }}>
      <input type="hidden" name="id" value={doc.id} />
      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 8 }}>
          {state.error}
        </div>
      )}
      <div className="fld">
        <label className="lbl" htmlFor={`submit-file-${doc.id}`}>
          {t("m.docs.submit.label", undefined, "Submit File")}
        </label>
        <input
          id={`submit-file-${doc.id}`}
          name="file"
          type="file"
          className="ps-input"
          required
          accept="image/*,application/pdf,.zip,.csv,.txt,.xlsx,.docx,.pptx,.doc,.xls"
          style={{ paddingTop: 11, paddingBottom: 11 }}
        />
        <div className="s" style={{ marginTop: 6 }}>
          {t("m.docs.submit.hint", undefined, "Uploading sends this document to the office for review.")}
        </div>
      </div>
      <button
        type="submit"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
        disabled={pending}
      >
        <KIcon name="Upload" size={15} />{" "}
        {pending
          ? t("m.docs.submit.sending", undefined, "Submitting…")
          : t("m.docs.submit.cta", undefined, "Submit For Review")}
      </button>
    </form>
  );
}

export function DocsView({ items, title }: { items: DocItem[]; eyebrow?: string; title: string }) {
  const t = useT();
  const toast = useToast();
  const [, startTransition] = useTransition();

  // Live time never renders on the server pass (hydration #418 pattern):
  // expiry badges appear after mount.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const cats = useMemo(() => Array.from(new Set(items.map((d) => d.cat))).sort(), [items]);

  // Kit 31 (v2.7 swipe canon): Save (info, signed-URL download) · Share
  // (neutral). Both mint the URL through the caller's own session, so the
  // document's RBAC scope travels with the link — nothing is shared that the
  // sharer could not open.
  const mintUrl = async (d: DocItem): Promise<string | null> => {
    if (d.kind === "personal") return signDocumentUrl({ id: d.id });
    if (!d.downloadable) return null;
    return `${window.location.origin}/api/v1/deliverables/${d.id}/download`;
  };

  const saveDoc = (d: DocItem) => {
    startTransition(async () => {
      try {
        const url = await mintUrl(d);
        if (!url) {
          toast.error(t("m.docs.swipe.noFile", undefined, "No file attached to this document."));
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
        toast.success(t("m.docs.swipe.saved", undefined, "Downloading"), { description: d.title });
      } catch {
        toast.error(t("m.docs.download.openError", undefined, "Couldn't open document"));
      }
    });
  };

  // Kit 32 A1 — the in-app viewer sheet: title bar, page area over the
  // signed URL, Download/Share footer. The URL is minted on open through
  // the caller's own session (same path as Save), so RBAC scope applies and
  // nothing renders that the viewer could not download.
  const [viewerDoc, setViewerDoc] = useState<DocItem | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerOffline, setViewerOffline] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);
  const closeViewer = () => {
    setViewerDoc(null);
    // Object URLs hold the blob alive until revoked.
    setViewerUrl((cur) => {
      if (cur?.startsWith("blob:")) URL.revokeObjectURL(cur);
      return null;
    });
    setViewerOffline(false);
  };
  const viewerRef = useDismissable<HTMLDivElement>(viewerDoc != null, closeViewer);

  const openViewer = (d: DocItem) => {
    setViewerDoc(d);
    setViewerUrl(null);
    setViewerOffline(false);
    setViewerLoading(true);
    startTransition(async () => {
      try {
        const url = await mintUrl(d);
        if (!url) {
          setViewerUrl(null);
          return;
        }
        // Blob-through-cache so a previously opened document stays readable
        // offline; fall back to the raw signed URL if blob plumbing fails
        // (e.g. a CORS surprise) rather than losing the preview entirely.
        try {
          const { objectUrl, fromCache } = await fetchViewerBlob(`${d.kind}-${d.id}`, url);
          setViewerUrl(objectUrl);
          setViewerOffline(fromCache);
        } catch {
          setViewerUrl(url);
        }
      } catch {
        setViewerUrl(null);
      } finally {
        setViewerLoading(false);
      }
    });
  };

  const shareDoc = (d: DocItem) => {
    startTransition(async () => {
      try {
        const url = await mintUrl(d);
        if (!url) {
          toast.error(t("m.docs.swipe.noFile", undefined, "No file attached to this document."));
          return;
        }
        if (typeof navigator.share === "function") {
          await navigator.share({ title: d.title, url });
          return;
        }
        await navigator.clipboard.writeText(url);
        toast.info(t("m.docs.swipe.linkCopied", undefined, "Link Copied"), {
          description: t("m.docs.swipe.scopeNote", undefined, "Access scope still applies"),
        });
      } catch {
        // Share sheet dismissed — not an error.
      }
    });
  };

  const FIELDS: FieldDef<DocItem>[] = [
    { id: "title", label: t("m.docs.col.title", undefined, "Title"), type: "text", get: (d) => d.title },
    { id: "cat", label: t("m.docs.group.cat", undefined, "Category"), type: "select", options: cats, get: (d) => d.cat },
    { id: "scope", label: t("m.docs.col.access", undefined, "Access"), type: "select", options: SCOPES, get: (d) => d.scope },
    { id: "updated", label: t("m.docs.col.updated", undefined, "Updated"), type: "text", get: (d) => d.updated ?? "" },
  ];

  // One extra badge per row at most: a lapsed/lapsing expiry outranks
  // verification, which shows only for the states a crew member must act on
  // or can rely on (rejected / verified). The sheet shows the full story.
  const statusBadge = (d: DocItem) => {
    if (d.kind !== "personal") {
      if (d.submittable) {
        return <span className={badgeClass("warn")}>{t("m.docs.badge.actionNeeded", undefined, "Action Needed")}</span>;
      }
      return null;
    }
    const days = now == null ? null : daysUntil(d.validUntil, now);
    if (days != null && days < 0) {
      return <span className={badgeClass("danger")}>{t("m.docs.badge.expired", undefined, "Expired")}</span>;
    }
    if (days != null && days <= 30) {
      return <span className={badgeClass("warn")}>{t("m.docs.badge.expiresSoon", undefined, "Expires Soon")}</span>;
    }
    if (d.verification === "rejected") {
      return <span className={badgeClass("danger")}>{t("m.docs.badge.rejected", undefined, "Rejected")}</span>;
    }
    if (d.verification === "verified") {
      return <span className={badgeClass("ok")}>{t("m.docs.badge.verified", undefined, "Verified")}</span>;
    }
    return null;
  };

  const row = (d: DocItem) => (
    <SwipeRow
      key={d.id}
      onClick={() => openViewer(d)}
      actions={[
        { icon: "Download", label: t("m.docs.swipe.save", undefined, "Save"), tone: "info", on: () => saveDoc(d) },
        { icon: "Share2", label: t("m.docs.swipe.share", undefined, "Share"), tone: "neutral", on: () => shareDoc(d) },
      ]}
    >
      <div className="item" style={{ margin: 0 }}>
        <span className="perm-ic" style={{ borderColor: "var(--p-border)", color: "var(--p-text-2)" }}>
          <KIcon name={d.kind === "personal" ? "FileText" : "File"} size={17} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{d.title}</div>
          <div className="s">
            {d.cat}
            {d.validUntil
              ? ` · ${t("m.docs.row.validUntil", undefined, "Valid Until")} ${d.validUntil}`
              : ""}
          </div>
        </div>
        {statusBadge(d)}
        <span className={badgeClass(SCOPE_TONE[d.scope])}>{d.scope}</span>
        {d.downloadable && d.kind === "personal" && (
          <span style={{ marginLeft: 8 }}>
            <DocDownloadLink docId={d.id} />
          </span>
        )}
      </div>
    </SwipeRow>
  );

  const uploadCta = (
    <Link
      href="/m/documents/new"
      className="ps-btn ps-btn--cta ps-btn--lg"
      style={{ width: "100%", justifyContent: "center", marginTop: 10, textDecoration: "none" }}
    >
      <KIcon name="Upload" size={15} /> {t("m.docs.upload", undefined, "Upload Document")}
    </Link>
  );

  return (
    <div className="screen screen-anim">
      <ScreenHeader onBack={() => window.dispatchEvent(new CustomEvent("compvss:nav-open"))} title={title} />

      <NormalizedList
        k="dc"
        items={items}
        fields={FIELDS}
        search={(d) => `${d.title} ${d.cat} ${d.scope}`}
        searchPlaceholder={t("m.docs.search", undefined, "Search Documents…")}
        renderRow={row}
        views={["list", "table"]}
        pill={{ get: (d) => d.scope, order: SCOPES }}
        empty={{
          cols: [
            t("m.docs.col.title", undefined, "Title"),
            t("m.docs.col.access", undefined, "Access"),
            t("m.docs.col.updated", undefined, "Updated"),
          ],
          title: t("m.docs.empty.title", undefined, "No Documents"),
          hint: t(
            "m.docs.empty.body",
            undefined,
            "Project documents you can access land here. Upload your own tickets, licenses and certifications to keep them on you.",
          ),
        }}
        footer={uploadCta}
      />

      {/* Kit 32 A1 — in-app document viewer sheet. */}
      {viewerDoc && (
        <div className="sheet">
          <button type="button" className="sheet-bg" aria-label={t("common.close", undefined, "Close")} onClick={closeViewer} />
          <div ref={viewerRef} className="sheet-panel" role="dialog" aria-modal="true" aria-label={viewerDoc.title}>
            <div className="sheet-grip" />
            <SheetHead
              icon={viewerDoc.kind === "personal" ? "FileText" : "File"}
              title={viewerDoc.title}
              sub={viewerDoc.cat}
              closeLabel={t("common.close", undefined, "Close")}
              onClose={closeViewer}
            />
            <div
              style={{
                border: "1px solid var(--p-border)",
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--p-surface-2, var(--p-surface))",
                marginBottom: 12,
                minHeight: 220,
                display: "flex",
                alignItems: "stretch",
              }}
            >
              {viewerLoading ? (
                <div className="hint" style={{ margin: "auto", padding: 24 }}>
                  {t("m.docs.viewer.loading", undefined, "Opening…")}
                </div>
              ) : viewerUrl ? (
                <iframe
                  src={viewerUrl}
                  title={viewerDoc.title}
                  style={{ width: "100%", height: "52vh", border: "none", display: "block" }}
                />
              ) : (
                <div className="hint" style={{ margin: "auto", padding: 24, textAlign: "center" }}>
                  {t("m.docs.viewer.noFile", undefined, "No file attached to this document.")}
                </div>
              )}
            </div>
            {viewerUrl && viewerOffline && (
              <div className="ps-alert ps-alert--warn" role="status" style={{ marginBottom: 10 }}>
                {t("m.docs.viewer.offlineCopy", undefined, "Offline. Showing the last copy saved on this device.")}
              </div>
            )}
            {viewerUrl && (
              <div className="hint" style={{ marginBottom: 10 }}>
                {t("m.docs.viewer.hint", undefined, "If the preview doesn't load on this device, use Download.")}
              </div>
            )}
            {viewerDoc.kind === "personal" && (viewerDoc.validUntil || viewerDoc.verification) && (
              <div className="hint" style={{ marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {viewerDoc.verification === "verified" && (
                  <span className={badgeClass("ok")}>{t("m.docs.badge.verified", undefined, "Verified")}</span>
                )}
                {viewerDoc.verification === "pending_review" && (
                  <span className={badgeClass("info")}>{t("m.docs.badge.inReview", undefined, "In Review")}</span>
                )}
                {viewerDoc.verification === "rejected" && (
                  <span className={badgeClass("danger")}>{t("m.docs.badge.rejected", undefined, "Rejected")}</span>
                )}
                {viewerDoc.validUntil && (
                  <span>
                    {t("m.docs.row.validUntil", undefined, "Valid Until")} {viewerDoc.validUntil}
                  </span>
                )}
              </div>
            )}
            {viewerDoc.submittable && (
              <SubmitFileForm
                doc={viewerDoc}
                onDone={() => {
                  toast.success(t("m.docs.submit.done", undefined, "Submitted For Review"), {
                    description: viewerDoc.title,
                  });
                  closeViewer();
                }}
              />
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="ps-btn ps-btn--cta ps-btn--lg"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => saveDoc(viewerDoc)}
              >
                <KIcon name="Download" size={15} /> {t("m.docs.viewer.download", undefined, "Download")}
              </button>
              <button
                type="button"
                className="ps-btn ps-btn--secondary ps-btn--lg"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => shareDoc(viewerDoc)}
              >
                <KIcon name="Share2" size={15} /> {t("m.docs.viewer.share", undefined, "Share")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
