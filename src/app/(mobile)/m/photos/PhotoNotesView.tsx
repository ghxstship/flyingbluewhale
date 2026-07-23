"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KIcon, NormalizedList, type FieldDef } from "@/components/mobile/kit";
import { useFormatters, useT } from "@/lib/i18n/LocaleProvider";

export type PhotoNoteItem = {
  id: string;
  /** Short-lived signed thumbnail URL; null renders a placeholder tile. */
  url: string | null;
  note: string | null;
  projectName: string | null;
  capturedAt: string;
  located: boolean;
  mine: boolean;
};

type Labels = {
  eyebrow: string;
  title: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyHint: string;
  cta: string;
  unfiled: string;
  located: string;
  mine: string;
};

/**
 * COMPVSS · Photo Notes list (T1-5 expansion) — normalized surface
 * (NormalizedList) over `field_photo_notes`. Filter pill = project (context
 * field, never a status). Gallery view leans on the signed thumbnails.
 */
export function PhotoNotesView({ items, labels }: { items: PhotoNoteItem[]; labels: Labels }) {
  const router = useRouter();
  const t = useT();
  const fmt = useFormatters();

  const projectOf = (x: PhotoNoteItem) => x.projectName ?? labels.unfiled;
  const allProjects = [...new Set(items.map(projectOf))];

  const colNote = t("m.capture.photos.col.note", undefined, "Note");
  const colProject = t("m.capture.photos.col.project", undefined, "Project");
  const colWhen = t("m.capture.photos.col.when", undefined, "Captured");

  const FIELDS: FieldDef<PhotoNoteItem>[] = [
    { id: "note", label: colNote, type: "text", get: (x) => x.note ?? "" },
    { id: "project", label: colProject, type: "select", options: allProjects, get: projectOf },
    {
      id: "capturedAt",
      label: colWhen,
      type: "date",
      get: (x) => x.capturedAt,
      iso: (x) => (x.capturedAt ? x.capturedAt.slice(0, 10) : null),
    },
  ];

  const when = (iso: string) =>
    fmt.dateParts(new Date(iso), { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  const thumb = (x: PhotoNoteItem, size: number) =>
    x.url ? (
      // eslint-disable-next-line @next/next/no-img-element -- short-lived signed storage URL, not an optimizable asset
      <img src={x.url} alt="" width={size} height={size} style={{ borderRadius: 8, objectFit: "cover", width: size, height: size }} />
    ) : (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--p-surface-2, var(--p-border))",
          flex: "none",
        }}
      >
        <KIcon name="Camera" size={16} />
      </span>
    );

  const row = (x: PhotoNoteItem) => (
    <div key={x.id} className="item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
      {thumb(x, 44)}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {x.note || projectOf(x)}
        </div>
        {/* Locale/timezone formatting differs SSR vs browser — informational
            timestamp only, so suppress the per-cell hydration check. */}
        <div className="hint" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }} suppressHydrationWarning>
          <span>{projectOf(x)}</span>
          <span>·</span>
          <span>{when(x.capturedAt)}</span>
          {x.located && <KIcon name="MapPin" size={11} />}
        </div>
      </div>
    </div>
  );

  return (
    <div className="screen screen-anim">
      <button type="button" className="backbtn" onClick={() => router.back()}>
        <KIcon name="ChevronLeft" size={17} /> {t("m.capture.photos.back", undefined, "Back")}
      </button>
      <div className="scr-eye">{labels.eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {labels.title}
      </h1>

      <NormalizedList
        k="photonotes"
        items={items}
        fields={FIELDS}
        search={(x) => `${x.note ?? ""} ${projectOf(x)}`}
        searchPlaceholder={labels.searchPlaceholder}
        renderRow={row}
        views={["list", "table", "calendar", "gallery"]}
        dateField="capturedAt"
        gallery={(x) => thumb(x, 96)}
        pill={{ get: projectOf, order: allProjects }}
        empty={{ cols: [colNote, colProject, colWhen], title: labels.emptyTitle, hint: labels.emptyHint }}
        footer={
          <Link href="/m/capture" className="ps-btn ps-btn--cta ps-btn--lg" style={{ width: "100%", justifyContent: "center" }}>
            <KIcon name="Camera" size={16} /> {labels.cta}
          </Link>
        }
      />
    </div>
  );
}
