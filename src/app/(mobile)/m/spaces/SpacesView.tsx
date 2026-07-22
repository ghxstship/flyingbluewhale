"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionBar, Fab, KIcon, SheetHead } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createSpace } from "./actions";

export type SpaceRow = {
  id: string;
  name: string;
  kind: "team" | "trade" | "location" | "club";
  about: string | null;
  members: number;
  joined: boolean;
};

/** English fallbacks — display labels resolve through t() per kind. */
const KIND_FALLBACK: Record<SpaceRow["kind"], string> = {
  team: "Team",
  trade: "Trade",
  location: "Location",
  club: "Club",
};

const SPACE_KINDS = Object.keys(KIND_FALLBACK) as SpaceRow["kind"][];

const KIND_ICON: Record<SpaceRow["kind"], string> = {
  team: "Users",
  trade: "Wrench",
  location: "MapPin",
  club: "Sparkles",
};

/**
 * Kit 28 `spaces`: kind filter, row opens the space, joined state visible at
 * a glance. The New Space FAB opens a real create sheet — the kit's FAB is a
 * prototype stub (it toasts "Name it, pick who's in, and post" and creates
 * nothing); this is that sentence implemented rather than recited.
 */
export function SpacesView({ rows, eyebrow, title }: { rows: SpaceRow[]; eyebrow: string; title: string }) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [kinds, setKinds] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<SpaceRow["kind"]>("team");
  const [about, setAbout] = useState("");

  const kindLabel = (k: SpaceRow["kind"]) => t(`m.spaces.kindLabel.${k}`, undefined, KIND_FALLBACK[k]);

  const items = useMemo(() => {
    const q = query.toLowerCase();
    return rows
      .filter((r) => kinds.size === 0 || kinds.has(r.kind))
      .filter((r) => !q || `${r.name} ${r.about ?? ""}`.toLowerCase().includes(q));
  }, [rows, query, kinds]);

  const toggleKind = (k: string) =>
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const submit = () => {
    if (pending || !name.trim()) return;
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("kind", kind);
    fd.set("about", about);
    startTransition(async () => {
      // Success never returns — the action redirects into the new space.
      const res = await createSpace(null, fd);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

      <ActionBar
        k="sp"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.spaces.search", undefined, "Search Spaces…")}
        filterActive={kinds.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <>
            <div className="wl" style={{ marginBottom: 8 }}>
              {t("m.spaces.kind", undefined, "Kind")}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
              {SPACE_KINDS.map((k) => (
                <button key={k} type="button" className={`chip ${kinds.has(k) ? "on" : ""}`} onClick={() => toggleKind(k)}>
                  {kindLabel(k)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="pill"
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
              onClick={() => setKinds(new Set())}
            >
              {t("m.spaces.reset", undefined, "Reset Filters")}
            </button>
          </>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.spaces.empty.title", undefined, "No Spaces Yet")}
          description={t(
            "m.spaces.empty.body",
            undefined,
            "Team, trade, location and club channels live here. Start one and post.",
          )}
        />
      ) : (
        items.map((r) => (
          <Link key={r.id} href={`/m/spaces/${r.id}`} className="item tap" style={{ textDecoration: "none", color: "inherit" }}>
            <span
              className="qi"
              style={{
                background: "color-mix(in oklab, var(--p-accent) 14%, transparent)",
                color: "var(--p-accent-text)",
              }}
            >
              <KIcon name={KIND_ICON[r.kind]} size={17} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="t">{r.name}</div>
              <div className="s" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {kindLabel(r.kind)} · {r.members}{" "}
                {r.members === 1 ? t("m.spaces.member", undefined, "Member") : t("m.spaces.members", undefined, "Members")}
                {r.about ? ` · ${r.about}` : ""}
              </div>
            </div>
            {r.joined && (
              <span className={`ps-badge ps-badge--ok`}>{t("m.spaces.joined", undefined, "Joined")}</span>
            )}
          </Link>
        ))
      )}

      {/* Kit FAB: New Space. */}
      <Fab label={t("m.spaces.new", undefined, "New Space")} onClick={() => setCreateOpen(true)} />

      {createOpen && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label={t("m.spaces.new", undefined, "New Space")}>
          <button
            type="button"
            className="sheet-bg"
            aria-label={t("m.spaces.sheetClose", undefined, "Close")}
            tabIndex={-1}
            style={{ border: "none", padding: 0, cursor: "default" }}
            onClick={() => setCreateOpen(false)}
          />
          <div className="sheet-panel">
            <div className="sheet-grip" />
            {/* Kit 32 (drawer canon v2.8): FORM drawer (3 fields ≤ the 5-field
                cap) with the canonical SheetHead — no sheet ships without an
                explicit ✕. */}
            <SheetHead
              icon="UsersRound"
              title={t("m.spaces.new", undefined, "New Space")}
              closeLabel={t("m.spaces.sheetClose", undefined, "Close")}
              onClose={() => setCreateOpen(false)}
            />
            {error && (
              <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 10 }}>
                {error}
              </div>
            )}
            <div className="fld">
              <label className="lbl" htmlFor="space-name">
                {t("m.spaces.name", undefined, "Name")}
              </label>
              <input
                id="space-name"
                className="ps-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder={t("m.spaces.namePlaceholder", undefined, "e.g. Riggers")}
              />
            </div>
            <div className="fld">
              <label className="lbl">{t("m.spaces.kind", undefined, "Kind")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {SPACE_KINDS.map((k) => (
                  <button key={k} type="button" className={`chip ${kind === k ? "on" : ""}`} onClick={() => setKind(k)}>
                    {kindLabel(k)}
                  </button>
                ))}
              </div>
            </div>
            <div className="fld">
              <label className="lbl" htmlFor="space-about">
                {t("m.spaces.about", undefined, "About")}
              </label>
              <input
                id="space-about"
                className="ps-input"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                maxLength={500}
                placeholder={t("m.spaces.aboutPlaceholder", undefined, "What is this space for?")}
              />
            </div>
            <button
              type="button"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ width: "100%", justifyContent: "center", marginTop: 8, opacity: name.trim() ? 1 : 0.5 }}
              disabled={pending || !name.trim()}
              onClick={submit}
            >
              <KIcon name="Plus" size={15} />{" "}
              {pending ? t("m.spaces.creating", undefined, "Creating…") : t("m.spaces.create", undefined, "Create Space")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
