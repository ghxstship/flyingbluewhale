"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ActionBar, EmptySkeleton, GroupedList, KIcon, SheetHead, SwipeRow, TogRow } from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { useDismissable } from "@/components/mobile/kit/useDismissable";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { DocDownloadLink } from "./DocDownloadLink";
import { signDocumentUrl } from "./actions";

export type DocScope = "All" | "Team" | "Role" | "You" | "Restricted";

export type DocItem = {
  id: string;
  title: string;
  cat: string;
  scope: DocScope;
  kind: "deliverable" | "personal";
  downloadable: boolean;
  updated: string | null;
};

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

export function DocsView({ items, eyebrow, title }: { items: DocItem[]; eyebrow: string; title: string }) {
  const t = useT();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState("name");
  const [scopes, setScopes] = useState<Set<DocScope>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const cats = useMemo(() => Array.from(new Set(items.map((d) => d.cat))).sort(), [items]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items
      .filter((d) => scopes.size === 0 || scopes.has(d.scope))
      .filter((d) => !q || (d.title + " " + d.cat).toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "cat" ? a.cat.localeCompare(b.cat) : sort === "updated" ? (b.updated ?? "").localeCompare(a.updated ?? "") : a.title.localeCompare(b.title),
      );
  }, [items, query, scopes, sort]);

  const toggleScope = (s: DocScope) =>
    setScopes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

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
  const [viewerLoading, setViewerLoading] = useState(false);
  const closeViewer = () => {
    setViewerDoc(null);
    setViewerUrl(null);
  };
  const viewerRef = useDismissable<HTMLDivElement>(viewerDoc != null, closeViewer);

  const openViewer = (d: DocItem) => {
    setViewerDoc(d);
    setViewerUrl(null);
    setViewerLoading(true);
    startTransition(async () => {
      try {
        const url = await mintUrl(d);
        setViewerUrl(url);
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
          <div className="s">{d.cat}</div>
        </div>
        <span className={badgeClass(SCOPE_TONE[d.scope])}>{d.scope}</span>
        {d.downloadable && d.kind === "personal" && (
          <span style={{ marginLeft: 8 }}>
            <DocDownloadLink docId={d.id} />
          </span>
        )}
      </div>
    </SwipeRow>
  );

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>{title}</h1>

      <Link
        href="/m/documents/new"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginBottom: 12 }}
      >
        <KIcon name="Upload" size={15} /> {t("m.docs.upload", undefined, "Upload Document")}
      </Link>

      <ActionBar
        k="dc"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.docs.search", undefined, "Search Documents…")}
        view={view}
        setView={setView}
        views={["list"]}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", t("m.docs.group.none", undefined, "None")],
          ["cat", t("m.docs.group.cat", undefined, "Category")],
          ["scope", t("m.docs.group.scope", undefined, "Access")],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["name", t("m.docs.sort.name", undefined, "Name")],
          ["cat", t("m.docs.sort.cat", undefined, "Category")],
          ["updated", t("m.docs.sort.updated", undefined, "Updated")],
        ]}
        filterActive={scopes.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            {SCOPES.map((s) => (
              <TogRow key={s} label={s} on={scopes.has(s)} set={() => toggleScope(s)} />
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptySkeleton
          cols={[
            t("m.docs.col.title", undefined, "Title"),
            t("m.docs.col.access", undefined, "Access"),
            t("m.docs.col.updated", undefined, "Updated"),
          ]}
          title={t("m.docs.empty.title", undefined, "No Documents")}
          hint={t(
            "m.docs.empty.body",
            undefined,
            "Project documents you can access land here. Upload your own tickets, licenses and certifications to keep them on you.",
          )}
          action={
            <Link href="/m/documents/new" className="ps-btn ps-btn--cta">
              <KIcon name="Upload" size={15} /> {t("m.docs.upload", undefined, "Upload Document")}
            </Link>
          }
        />
      ) : group === "cat" ? (
        <GroupedList
          skey="dc"
          groups={cats.filter((c) => filtered.some((d) => d.cat === c)).map((c) => [c, filtered.filter((d) => d.cat === c)])}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          renderRow={row}
        />
      ) : group === "scope" ? (
        <GroupedList
          skey="dc"
          groups={SCOPES.filter((s) => filtered.some((d) => d.scope === s)).map((s) => [
            s,
            filtered.filter((d) => d.scope === s),
          ])}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          renderRow={row}
        />
      ) : (
        filtered.map(row)
      )}

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
            {viewerUrl && (
              <div className="hint" style={{ marginBottom: 10 }}>
                {t("m.docs.viewer.hint", undefined, "If the preview doesn't load on this device, use Download.")}
              </div>
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
