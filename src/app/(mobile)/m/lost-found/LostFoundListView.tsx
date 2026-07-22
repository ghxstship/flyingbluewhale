"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NormalizedList, KIcon, RecordDetail, type FieldDef } from "@/components/mobile/kit";
import { PhotoStrip, type StripPhoto } from "@/components/media/PhotoStrip";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useToast } from "@/lib/hooks/useToast";
import { toFormData } from "@/lib/mobile/form-data";
import { claimLostItem, type State } from "./actions";

/**
 * Lost & Found — the org-wide property roll (`incidents` where
 * report_kind='lost_property'), on the kit view engine (NormalizedList: search
 * over summary/description/location + View Options / Share & Export drawers +
 * typed location pills + list/gallery/board/table). Photos are signed
 * server-side and threaded per item.
 *
 * A row opens its record so a held item can be handed back: the surface was
 * file-only, so the desk's list only ever grew and "Claimed" was a state
 * nothing could reach.
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
  return (
    <span className={`ps-badge ps-badge--${tone === "warning" ? "warn" : tone === "success" ? "ok" : tone}`}>
      {children}
    </span>
  );
}

export function LostFoundListView({ items }: { items: LostFoundItem[] }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [detail, setDetail] = useState<LostFoundItem | null>(null);
  const [, startTx] = useTransition();

  const onClaim = (x: LostFoundItem) => {
    startTx(async () => {
      const res: State = await claimLostItem(null, toFormData({ id: x.id }));
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setDetail(null);
      router.refresh();
    });
  };

  const heldLabel = t("m.lostfound.held", undefined, "Held");
  const claimedLabel = t("m.lostfound.claimed", undefined, "Claimed");
  const stateOf = (x: LostFoundItem) => (x.incident_state !== "closed" ? heldLabel : claimedLabel);
  const labelOf = (x: LostFoundItem) => x.summary ?? t("m.lostfound.item", undefined, "Property Report");
  const isLost = (x: LostFoundItem) => (x.summary ?? "").startsWith("Lost");

  const fields: FieldDef<LostFoundItem>[] = [
    { id: "summary", label: t("m.lostfound.col.item", undefined, "Item"), type: "text", get: labelOf },
    {
      id: "incident_state",
      label: t("m.lostfound.col.status", undefined, "Status"),
      type: "select",
      options: STATE_ORDER,
      get: stateOf,
    },
    {
      id: "location",
      label: t("m.lostfound.col.location", undefined, "Location"),
      type: "select",
      get: (x) => x.location ?? "",
    },
    {
      id: "description",
      label: t("m.lostfound.col.notes", undefined, "Notes"),
      type: "text",
      get: (x) => x.description ?? "",
    },
  ];

  const row = (x: LostFoundItem, compact?: boolean) => (
    <div
      className="item tap"
      key={x.id}
      style={{ display: "block" }}
      role="button"
      tabIndex={0}
      onClick={() => setDetail(x)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDetail(x);
        }
      }}
    >
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
      <div className="t" style={{ marginTop: 8 }}>
        {labelOf(x)}
      </div>
      <div className="s" style={{ marginBottom: 6 }}>
        {x.location ?? ""}
        {x.dateLabel ? ` · ${x.dateLabel}` : ""}
      </div>
      <Badge tone={STATE_TONE[stateOf(x)] ?? "neutral"}>{stateOf(x)}</Badge>
    </div>
  );

  return (
    <>
      <NormalizedList
        k="lostfound"
        items={items}
        fields={fields}
        search={(x) => `${labelOf(x)} ${x.description ?? ""} ${x.location ?? ""}`}
        searchPlaceholder={t("m.lostfound.search", undefined, "Search lost & found…")}
        renderRow={row}
        onRow={setDetail}
        gallery={galleryCard}
        views={["list", "gallery", "board", "table"]}
        statusField="incident_state"
        statusOrder={STATE_ORDER}
        boardTone={STATE_TONE}
        pill={{ get: (x) => x.location ?? "—" }}
        empty={{
          cols: ["Item", "Status", "Location"],
          title: t("m.lostfound.emptyTitle", undefined, "Nothing Logged"),
          hint: t(
            "m.lostfound.emptyBody",
            undefined,
            "Lost or found property logged from the field shows up here for the whole org.",
          ),
        }}
      />
      {detail && (
        <RecordDetail
          title={labelOf(detail)}
          icon="PackageSearch"
          status={{ tone: STATE_TONE[stateOf(detail)] ?? "neutral", label: stateOf(detail) }}
          fields={[
            ...(detail.location
              ? [{ k: t("m.lostfound.col.location", undefined, "Location"), v: detail.location }]
              : []),
            ...(detail.dateLabel ? [{ k: t("m.lostfound.col.logged", undefined, "Logged"), v: detail.dateLabel }] : []),
            ...(detail.description
              ? [{ k: t("m.lostfound.col.notes", undefined, "Notes"), v: detail.description, full: true }]
              : []),
          ]}
          sections={
            detail.photos.length > 0
              ? [
                  {
                    h: t("m.lostfound.photos", undefined, "Photos"),
                    node: <PhotoStrip photos={detail.photos} label={labelOf(detail)} />,
                  },
                ]
              : []
          }
          // Claiming is terminal (the shared incident FSM's `closed`), so an
          // already-claimed item offers nothing rather than a refused action.
          actions={
            detail.incident_state !== "closed"
              ? [
                  {
                    label: t("m.lostfound.claim", undefined, "Mark Claimed"),
                    icon: "Check",
                    primary: true,
                    confirmText: t(
                      "m.lostfound.claimConfirm",
                      undefined,
                      "Hand this back to its owner? It leaves the held list.",
                    ),
                    on: () => onClaim(detail),
                  },
                ]
              : []
          }
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
