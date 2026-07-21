"use client";

import { NormalizedList, KIcon, type FieldDef } from "@/components/mobile/kit";
import { PhotoStrip, type StripPhoto } from "@/components/media/PhotoStrip";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Lost & Found — the org-wide property roll (`incidents` where
 * report_kind='lost_property'), migrated onto the kit view engine
 * (NormalizedList: search over summary/description/location + View Options /
 * Share & Export drawers + typed location pills + list/gallery/board/table).
 * Photos are signed server-side and threaded per item. Rows are read-only
 * (there is no detail route — a finder logs it, an owner looks for it), so no
 * `onRow` is wired: current behavior preserved.
 */
export type LostFoundItem = {
  id: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  incident_state: string | null;
  dateLabel: string | null;
  photos: StripPhoto[];
};

const STATE_TONE: Record<string, string> = { Held: "warning", Claimed: "success" };
const STATE_ORDER = ["Held", "Claimed"];

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`ps-badge ps-badge--${tone === "warning" ? "warn" : tone === "success" ? "ok" : tone}`}>{children}</span>;
}

export function LostFoundListView({ items }: { items: LostFoundItem[] }) {
  const t = useT();

  const heldLabel = t("m.lostfound.held", undefined, "Held");
  const claimedLabel = t("m.lostfound.claimed", undefined, "Claimed");
  const stateOf = (x: LostFoundItem) => (x.incident_state !== "closed" ? heldLabel : claimedLabel);
  const labelOf = (x: LostFoundItem) => x.summary ?? t("m.lostfound.item", undefined, "Property Report");
  const isLost = (x: LostFoundItem) => (x.summary ?? "").startsWith("Lost");

  const fields: FieldDef<LostFoundItem>[] = [
    { id: "summary", label: t("m.lostfound.col.item", undefined, "Item"), type: "text", get: labelOf },
    { id: "incident_state", label: t("m.lostfound.col.status", undefined, "Status"), type: "select", options: STATE_ORDER, get: stateOf },
    { id: "location", label: t("m.lostfound.col.location", undefined, "Location"), type: "select", get: (x) => x.location ?? "" },
    { id: "description", label: t("m.lostfound.col.notes", undefined, "Notes"), type: "text", get: (x) => x.description ?? "" },
  ];

  const row = (x: LostFoundItem, compact?: boolean) => (
    <div className="item" key={x.id} style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <KIcon
          name={isLost(x) ? "SearchX" : "PackageCheck"}
          size={18}
          style={{ color: "var(--p-text-2)", flex: "none" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">{labelOf(x)}</div>
          <div className="s">
            {x.location ?? ""}
            {x.dateLabel ? ` · ${x.dateLabel}` : ""}
          </div>
        </div>
        <Badge tone={STATE_TONE[stateOf(x)] ?? "neutral"}>{stateOf(x)}</Badge>
      </div>
      {!compact && x.description ? (
        <p className="form-intro" style={{ margin: "8px 0 0" }}>
          {x.description}
        </p>
      ) : null}
      {!compact && <PhotoStrip photos={x.photos} label={labelOf(x)} />}
    </div>
  );

  const galleryCard = (x: LostFoundItem) => (
    <div>
      <PhotoStrip photos={x.photos} label={labelOf(x)} />
      <div className="t" style={{ marginTop: 8 }}>{labelOf(x)}</div>
      <div className="s" style={{ marginBottom: 6 }}>
        {x.location ?? ""}
        {x.dateLabel ? ` · ${x.dateLabel}` : ""}
      </div>
      <Badge tone={STATE_TONE[stateOf(x)] ?? "neutral"}>{stateOf(x)}</Badge>
    </div>
  );

  return (
    <NormalizedList
      k="lostfound"
      items={items}
      fields={fields}
      search={(x) => `${labelOf(x)} ${x.description ?? ""} ${x.location ?? ""}`}
      searchPlaceholder={t("m.lostfound.search", undefined, "Search lost & found…")}
      renderRow={row}
      gallery={galleryCard}
      views={["list", "gallery", "board", "table"]}
      statusField="incident_state"
      statusOrder={STATE_ORDER}
      boardTone={STATE_TONE}
      pill={{ get: (x) => x.location ?? "—" }}
      empty={{ cols: ["Item", "Status", "Location"], title: t("m.lostfound.emptyTitle", undefined, "Nothing Logged"), hint: t("m.lostfound.emptyBody", undefined, "Lost or found property logged from the field shows up here for the whole org.") }}
    />
  );
}
