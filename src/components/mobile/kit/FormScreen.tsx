"use client";

/* COMPVSS Field — mobile form system. Data-driven full-screen forms.
   Ported from the prototype's FormScreen + Field/ComboField/AvatarField. */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { KIcon } from "./icon";
import { downscaleAll, downscaleImage } from "@/lib/mobile/image";
import { getPosition } from "@/lib/geo/position";
import type { PhotoFix } from "@/lib/mobile/photo-geo";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { FORMS } from "./forms";
import { Sheet } from "./Sheet";
import type { FormDef, FormField } from "./forms";

/** Above this option count a select renders as a searchable ACTION drawer
 *  (kit 32 drawer canon v2.8 — the cost-code picker rule: ≤8 keeps the
 *  native select, >8 gets search). */
const PICKER_DRAWER_THRESHOLD = 8;

// Severity tiers: High/Urgent = red, Medium = orange, Low = yellow. [bg, text]
// Kit 32 DS_ALIGNMENT §3: the fills live in the token layer now
// (--p-sev-{high,med,low} + -on inks, atlvs-product.css beside the semantic
// signals; mirrored in tokens.json#color.severity) — no hex literals here.
export const TIER_COLOR: Record<string, [string, string]> = {
  High: ["var(--p-sev-high)", "var(--p-sev-high-on)"],
  Urgent: ["var(--p-sev-high)", "var(--p-sev-high-on)"],
  Medium: ["var(--p-sev-med)", "var(--p-sev-med-on)"],
  Low: ["var(--p-sev-low)", "var(--p-sev-low-on)"],
};

// The avatar now carries the actual picked File, not a boolean claiming
// one exists. `img: boolean` was the whole bug.
type AvatarValue = { file: File; zoom: number; pos: number } | null;

// Type-to-search combobox: filter a list of options as you type.
function ComboField({
  value,
  setValue,
  options,
  placeholder,
}: {
  value: unknown;
  setValue: (v: unknown) => void;
  options: string[];
  placeholder?: string;
}) {
  const initial = typeof value === "string" ? value : "";
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setQ(typeof value === "string" ? value : "");
  }, [value]);
  const matches = options.filter((o) => o.toLowerCase().includes((q || "").toLowerCase()));
  return (
    <div style={{ position: "relative" }}>
      <div className="inwrap" style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          value={q}
          placeholder={placeholder || "Type to search…"}
          onChange={(e) => {
            setQ(e.target.value);
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          style={{ width: "100%" }}
        />
        <KIcon name={open ? "ChevronUp" : "Search"} size={16} style={{ position: "absolute", right: 13, color: "var(--p-text-3)", pointerEvents: "none" }} />
      </div>
      {open && (
        <>
          <button type="button" aria-label="Close options" tabIndex={-1} style={{ position: "fixed", inset: 0, zIndex: 5, border: "none", background: "transparent", padding: 0, cursor: "default" }} onClick={() => setOpen(false)} />
          <div role="listbox" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 6, background: "var(--p-surface)", border: "1px solid var(--p-border)", borderRadius: 12, boxShadow: "var(--p-elev-2, var(--p-elev-1))", maxHeight: 200, overflowY: "auto" }}>
            {matches.length ? (
              matches.map((o) => (
                <button
                  type="button"
                  key={o}
                  role="option"
                  aria-selected={value === o}
                  onClick={() => {
                    setValue(o);
                    setQ(o);
                    setOpen(false);
                  }}
                  style={{ display: "block", width: "100%", textAlign: "left", font: "inherit", background: "none", border: "none", borderBottom: "1px solid var(--p-border)", padding: "11px 14px", fontSize: 14, cursor: "pointer", color: value === o ? "var(--p-accent-text)" : "var(--p-text-1)", fontWeight: value === o ? 700 : 400 }}
                >
                  {o}
                </button>
              ))
            ) : (
              <div style={{ padding: "11px 14px", fontSize: 13, color: "var(--p-text-3)" }}>No matches — “{q}” will be used as typed.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Long-enum single-pick as an ACTION drawer — kit 32 Drawer System (v2.8).
 *
 * The cost-code case: an org with dozens of cost centers cannot scroll a
 * native <select> wheel usefully, so past the threshold the field becomes a
 * trigger that opens a searchable drawer — single-pick, checkmark on the
 * current value, picking closes. The value contract is identical to the
 * native select (a plain option string), so form defs and actions see no
 * difference.
 */
function PickerField({
  f,
  value,
  setValue,
}: {
  f: FormField;
  value: unknown;
  setValue: (v: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const options = f.options || [];
  const current = typeof value === "string" ? value : "";
  const matches = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        style={{
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: "1px solid var(--p-border)",
          borderRadius: 11,
          padding: "var(--p-3)",
          fontSize: 14,
          fontFamily: "inherit",
          background: "var(--p-surface)",
          color: current ? "var(--p-text-1)" : "var(--p-text-3)",
          cursor: "pointer",
        }}
      >
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current || "Choose…"}
        </span>
        <KIcon name="ChevronsUpDown" size={15} style={{ color: "var(--p-text-3)", flex: "none" }} />
      </button>
      {open && (
        <Sheet
          icon="ListChecks"
          title={f.label}
          sub={`${options.length} Options`}
          onClose={() => setOpen(false)}
        >
          <div className="searchbar" style={{ marginBottom: 8 }}>
            <KIcon name="Search" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              aria-label={`Search ${f.label}`}
            />
          </div>
          {matches.map((o) => (
            <button
              key={o}
              type="button"
              className="item tap"
              style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
              onClick={() => {
                setValue(o);
                setQ("");
                setOpen(false);
              }}
            >
              <div className="t" style={{ flex: 1, minWidth: 0, fontWeight: o === current ? 700 : 500 }}>{o}</div>
              {o === current && <KIcon name="Check" size={17} style={{ color: "var(--p-success)", flex: "none" }} />}
            </button>
          ))}
          {!matches.length && (
            <div className="hint" style={{ padding: "10px 2px" }}>No matches.</div>
          )}
        </Sheet>
      )}
    </>
  );
}

/**
 * Avatar upload with an inline crop/save flow.
 *
 * The crop stage used to pose over a CSS-painted `.ac-photo` div with no file
 * input anywhere — "Upload Photo" opened a zoom slider for an image that did
 * not exist. It now picks a real file and crops the real pixels.
 */
function AvatarField({ value, setValue }: { value: unknown; setValue: (v: unknown) => void }) {
  const [stage, setStage] = useState<"view" | "crop">("view");
  const [zoom, setZoom] = useState(1.2);
  const [pos, setPos] = useState(0);
  const [pending, setPending] = useState<File | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const av = (value as AvatarValue) || null;
  const has = !!(av && av.file);

  useEffect(() => {
    if (!pending) {
      setPendingUrl(null);
      return;
    }
    const url = URL.createObjectURL(pending);
    setPendingUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pending]);

  const currentUrl = pendingUrl ?? (av?.file ? URL.createObjectURL(av.file) : null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPending(await downscaleImage(file, 640));
    setStage("crop");
  }

  if (stage === "crop") {
    return (
      <div className="avatar-crop">
        <div className="ac-stage">
          <div
            className="ac-photo"
            style={{
              transform: `translateX(${pos}px) scale(${zoom})`,
              ...(currentUrl
                ? { backgroundImage: `url(${currentUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : {}),
            }}
          />
          <div className="ac-mask" />
        </div>
        <div className="fld" style={{ marginBottom: 8 }}>
          <label htmlFor="ac-zoom">Zoom</label>
          <input id="ac-zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
        </div>
        <div className="fld" style={{ marginBottom: 12 }}>
          <label htmlFor="ac-pos">Position</label>
          <input id="ac-pos" type="range" min="-60" max="60" step="1" value={pos} onChange={(e) => setPos(parseInt(e.target.value))} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="ps-btn ps-btn--secondary ps-btn--lg" style={{ flex: 1, justifyContent: "center" }} onClick={() => { setPending(null); setStage("view"); }}>Cancel</button>
          <button
            type="button"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ flex: 1, justifyContent: "center", opacity: pending || av?.file ? 1 : 0.5 }}
            disabled={!pending && !av?.file}
            onClick={() => {
              const file = pending ?? av?.file ?? null;
              if (!file) return;
              setValue({ file, zoom, pos });
              setPending(null);
              setStage("view");
            }}
          >
            <KIcon name="Check" size={15} /> Save
          </button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <input id="avatar-pick" type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
      <label className="avatar-up" htmlFor="avatar-pick" aria-label={has ? "Change photo" : "Upload photo"} style={{ cursor: "pointer" }}>
        {has && currentUrl ? (
          <span
            className="avatar-up-img"
            style={{
              transform: `translateX(${av!.pos}px) scale(${av!.zoom})`,
              backgroundImage: `url(${currentUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : (
          <span style={{ fontFamily: "var(--p-mono)", fontWeight: 700 }}>
            <KIcon name="User" size={20} />
          </span>
        )}
        <span className="avatar-up-badge"><KIcon name="Camera" size={13} /></span>
      </label>
      <div>
        <label className="ps-btn ps-btn--secondary" htmlFor="avatar-pick" style={{ cursor: "pointer" }}>
          <KIcon name="Upload" size={14} /> {has ? "Change Photo" : "Upload Photo"}
        </label>
        {has && <button type="button" className="ac-remove" onClick={() => setValue(null)}>Remove</button>}
      </div>
    </div>
  );
}

/**
 * Real photo / file capture.
 *
 * This control used to be a lie: a button whose only effect was
 * `setValue(n + 1)`, rendering "3 photos added" while capturing nothing.
 * Seven form specs referenced it — incident, lost & found, maintenance,
 * receipt among them — and the incident action hard-coded `photos: []`, so a
 * worker documenting an injury got a UI that confirmed their evidence and a
 * database row with none of it.
 *
 * Now: a real file input. No custom camera code — `accept="image/*"` lets the
 * OS picker offer camera, library, and (on iOS) the document scanner, which
 * is more capable than anything we'd hand-roll and already understands
 * gloves, glare, and one-handed use. Photos downscale on device before they
 * ever touch the network.
 *
 * Photos are geotagged at pick time (`getPosition`) when — and only when —
 * the field opts in with `geotag: true`, index-aligned with the files and
 * carried to the server under the `{id}__geo` sibling key. Opt-in matters:
 * tagging every photo field would record where a crew member's personal
 * property is when they list a bike for sale, which nothing needs.
 *
 * The fix is best-effort by design: a denial, an indoor dead-zone, or a
 * device without GPS records "no location" and never blocks the submit — a
 * safety report from a concrete loading dock must still file. The chip below
 * the control tells the worker which of those two happened, so location
 * capture is something they can see rather than something done to them.
 */
function FileField({
  f,
  value,
  setValue,
  setSibling,
}: {
  f: FormField;
  value: unknown;
  setValue: (v: unknown) => void;
  setSibling?: (suffix: string, v: unknown) => void;
}) {
  const isPhoto = f.type === "photo";
  const geotag = isPhoto && f.geotag === true;
  const files = Array.isArray(value) ? (value as File[]) : [];
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  // Fixes are held here, index-aligned with `files`, and mirrored into the
  // form's values on every mutation. Local state is the source of truth: a
  // File cannot carry custom properties through FormData, so the geotag has
  // nowhere else to live.
  const [fixes, setFixes] = useState<(PhotoFix | null)[]>([]);
  const inputId = `ff-${f.id}`;

  // Object URLs must be revoked or the page leaks a few MB per capture.
  useEffect(() => {
    const urls = files.filter((x) => x.type.startsWith("image/")).map((x) => URL.createObjectURL(x));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  /** Mirror files + fixes into the form together so they can never diverge. */
  function commit(nextFiles: File[], nextFixes: (PhotoFix | null)[]) {
    setFixes(nextFixes);
    setValue(nextFiles);
    if (geotag) setSibling?.("geo", JSON.stringify(nextFixes));
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    setBusy(true);
    try {
      // Fix and downscale race each other — both are slow, neither depends
      // on the other, and the worker is waiting on the pair.
      const fixPromise = geotag ? getPosition() : Promise.resolve(null);
      const processed = isPhoto ? await downscaleAll(picked) : picked;
      const fix = await fixPromise;
      const capturedAt = new Date().toISOString();
      // One fix for the batch: picking 5 photos is one act in one place, and
      // 5 sequential GPS waits would be a 20s stall for identical answers.
      const batchFixes = processed.map(() =>
        fix ? { lat: fix.lat, lng: fix.lng, accuracyM: fix.accuracy, capturedAt } : null,
      );
      commit([...files, ...processed], [...fixes, ...batchFixes]);
    } finally {
      setBusy(false);
      // Reset so picking the same file twice still fires onChange.
      e.target.value = "";
    }
  }

  const remove = (i: number) =>
    commit(
      files.filter((_, idx) => idx !== i),
      fixes.filter((_, idx) => idx !== i),
    );

  // Report on what we actually hold, not on what we hoped for: only count
  // fixes belonging to files still attached.
  const located = fixes.slice(0, files.length).filter(Boolean).length;

  return (
    <div>
      <input
        id={inputId}
        type="file"
        accept={isPhoto ? "image/*" : "image/*,application/pdf"}
        multiple
        onChange={onPick}
        style={{ display: "none" }}
      />
      <label htmlFor={inputId} className="dropz" style={{ width: "100%", cursor: "pointer", display: "flex" }}>
        <KIcon name={isPhoto ? "Camera" : "Paperclip"} size={22} />
        <span>
          {busy
            ? "Processing…"
            : files.length
              ? `${files.length} ${isPhoto ? "photo" : "file"}${files.length > 1 ? "s" : ""} attached · tap to add`
              : `Tap to ${isPhoto ? "capture or upload" : "attach"}`}
        </span>
      </label>

      {geotag && files.length > 0 && (
        <div
          className="hint"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 6,
            color: located ? "var(--p-success)" : "var(--p-text-3)",
          }}
        >
          <KIcon name={located ? "MapPin" : "MapPinOff"} size={13} />
          <span>
            {located === files.length
              ? "Location attached"
              : located
                ? `Location attached to ${located} of ${files.length}`
                : "No location — your device didn't provide one"}
          </span>
        </div>
      )}

      {files.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} style={{ position: "relative" }}>
              {previews[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previews[i]}
                  alt={file.name}
                  style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, display: "block" }}
                />
              ) : (
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 8,
                    border: "1px solid var(--p-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <KIcon name="FileText" size={20} />
                </div>
              )}
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => remove(i)}
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  width: 44,
                  height: 44,
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-end",
                  padding: 0,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: "var(--p-danger)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <KIcon name="X" size={12} />
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Signature capture for the field.
 *
 * Honours the SignaturePad a11y pairing rule (F-17): the freehand canvas is
 * pointer-only, so a typed-name input sits beside it as the keyboard /
 * assistive-tech path. Either one produces the same thing — a PNG File — so
 * downstream code has one shape to handle.
 *
 * Sized for a gloved finger: a wide canvas and a thick stroke, because a
 * gloved fingertip is a broad, imprecise brush and a 1px line from a stylus
 * design is unusable on a loading dock.
 */
function SignField({ f, value, setValue }: { f: FormField; value: unknown; setValue: (v: unknown) => void }) {
  const [typed, setTyped] = useState("");
  const signed = value instanceof File;

  const fromDataUrl = async (dataUrl: string) => {
    const blob = await (await fetch(dataUrl)).blob();
    setValue(new File([blob], `${f.id}-signature.png`, { type: "image/png" }));
  };

  // Render the typed name to a PNG so a keyboard signer and a freehand
  // signer produce the identical artifact.
  const fromTyped = (name: string) => {
    setTyped(name);
    if (!name.trim()) {
      setValue(null);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.font = "48px cursive, serif";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 24, canvas.height / 2);
    canvas.toBlob((blob) => {
      if (blob) setValue(new File([blob], `${f.id}-signature.png`, { type: "image/png" }));
    }, "image/png");
  };

  return (
    <div>
      <SignaturePad
        height={180}
        label={f.label}
        onChange={(dataUrl) => {
          setTyped("");
          void fromDataUrl(dataUrl);
        }}
        onClear={() => setValue(null)}
      />
      <div className="fld" style={{ marginTop: 8 }}>
        <label htmlFor={`sign-typed-${f.id}`}>Or type your full name</label>
        <input
          id={`sign-typed-${f.id}`}
          value={typed}
          onChange={(e) => fromTyped(e.target.value)}
          placeholder="Your full name"
          autoComplete="name"
        />
      </div>
      {signed && (
        <div className="hint" style={{ color: "var(--p-success)" }}>
          Signature captured.
        </div>
      )}
    </div>
  );
}

function Field({
  f,
  value,
  setValue,
  setSibling,
}: {
  f: FormField;
  value: unknown;
  setValue: (v: unknown) => void;
  /** Write a companion value under `{f.id}__{suffix}`. Used by photo capture
   *  to carry per-file geotags, which have nowhere to live on a File. */
  setSibling?: (suffix: string, v: unknown) => void;
}) {
  const common = {
    value: (value as string | number | undefined) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValue(e.target.value),
  };
  let control: React.ReactNode;
  if (f.type === "avatar") control = <AvatarField value={value} setValue={setValue} />;
  else if (f.type === "sign") control = <SignField f={f} value={value} setValue={setValue} />;
  else if (f.type === "textarea") control = <textarea {...common} placeholder={f.placeholder} />;
  else if (f.type === "select")
    control =
      (f.options || []).length > PICKER_DRAWER_THRESHOLD ? (
        <PickerField f={f} value={value} setValue={setValue} />
      ) : (
        <select {...common}>
          <option value="" disabled>Choose…</option>
          {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
  else if (f.type === "combo") control = <ComboField value={value} setValue={setValue} options={f.options || []} placeholder={f.placeholder} />;
  else if (f.type === "seg")
    control = (
      <div className="seg2">
        {(f.options || []).map((o) => {
          const tc = TIER_COLOR[o];
          const on = value === o;
          const style: CSSProperties | undefined = on && tc ? { background: tc[0], borderColor: tc[0], color: tc[1] } : undefined;
          return (
            <button key={o} type="button" className={on ? "on" : ""} style={style} onClick={() => setValue(o)}>{o}</button>
          );
        })}
      </div>
    );
  else if (f.type === "switch")
    control = (
      <button
        type="button"
        className="switch"
        role="switch"
        aria-checked={!!value}
        aria-label={f.label}
        data-on={value ? "1" : undefined}
        onClick={() => setValue(!value)}
        style={{ border: "none", padding: 0 }}
      >
        <span className="knob" />
      </button>
    );
  else if (f.type === "photo" || f.type === "file")
    control = <FileField f={f} value={value} setValue={setValue} setSibling={setSibling} />;
  else control = <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "time" ? "time" : "text"} {...common} placeholder={f.placeholder} />;

  if (f.type === "switch") {
    return (
      <div className="fld" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <label style={{ margin: 0 }}>{f.label}</label>
        {control}
      </div>
    );
  }
  return (
    <div className="fld" style={f.half ? { width: "100%" } : undefined}>
      <label>{f.label}{f.required && <span className="req"> *</span>}</label>
      {control}
      {f.hint && <div className="hint">{f.hint}</div>}
    </div>
  );
}

export function FormScreen({
  formId,
  def: customDef,
  initial,
  onClose,
  onSubmit,
  onFieldChange,
}: {
  formId?: string;
  def?: FormDef;
  initial?: Record<string, unknown>;
  onClose: () => void;
  onSubmit: (def: FormDef, vals: Record<string, unknown>) => void;
  /** Optional per-field derivation hook — called after a field commits, with
   *  a patch writer so a wrapper can prefill siblings (the PO form derives
   *  item/vendor from a pasted product URL). Defs stay serializable; the
   *  behavior lives in the mounting client component. */
  onFieldChange?: (id: string, value: unknown, vals: Record<string, unknown>, patch: (updates: Record<string, unknown>) => void) => void;
}) {
  const def = customDef || (formId ? FORMS[formId] : undefined);
  const [vals, setVals] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    def?.fields.forEach((f) => {
      if (f.default != null) init[f.id] = f.default;
    });
    if (initial) Object.assign(init, initial);
    return init;
  });
  if (!def) return null;
  const setV = (id: string, v: unknown) => {
    setVals((p) => ({ ...p, [id]: v }));
    // Outside the updater — an updater must stay pure (strict mode runs it
    // twice). The snapshot passed down is close-enough-current for derivation.
    onFieldChange?.(id, v, { ...vals, [id]: v }, (updates) => setVals((q) => ({ ...q, ...updates })));
  };
  // requiredFor keys off the discriminating segment the def uses — the
  // advance form's Category (`cat`) or the PO form's Budget Coding
  // (`coding`), matching the kit runtime exactly.
  const isReq = (f: FormField) =>
    f.required ||
    (f.requiredFor && (f.requiredFor.includes(vals.cat as string) || f.requiredFor.includes(vals.coding as string)));
  // `!value` is wrong for the file fields: an empty array is truthy, so a
  // required photo field would satisfy itself with zero photos. Treat an
  // empty array as absent.
  const isEmpty = (v: unknown) => (Array.isArray(v) ? v.length === 0 : !v);
  const missing = def.fields.filter((f) => isReq(f) && isEmpty(vals[f.id]));
  const submit = () => {
    if (missing.length) return;
    onSubmit(def, vals);
  };

  return (
    <div className="formscreen">
      <div className="form-top" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--p-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--p-text-3)" }}>{def.kicker || "New"}</span>
        <button type="button" className="modal-x" onClick={onClose} aria-label="Close"><KIcon name="X" size={18} /></button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span className="form-ic"><KIcon name={def.icon} size={20} /></span>
        <h1 className="scr-h" style={{ margin: 0 }}>{def.title}</h1>
      </div>
      {def.intro && <p className="form-intro">{def.intro}</p>}
      {(() => {
        // render in source order, pairing consecutive half fields into rows
        const out: React.ReactNode[] = [];
        let i = 0;
        while (i < def.fields.length) {
          const f = def.fields[i]!;
          const next = def.fields[i + 1];
          if (f.half && next && next.half) {
            out.push(
              <div className="frow" key={i}>
                <Field f={f} value={vals[f.id]} setValue={(v) => setV(f.id, v)} setSibling={(s, v) => setV(`${f.id}__${s}`, v)} />
                <Field f={next} value={vals[next.id]} setValue={(v) => setV(next.id, v)} setSibling={(s, v) => setV(`${next.id}__${s}`, v)} />
              </div>
            );
            i += 2;
          } else {
            out.push(<Field key={i} f={f} value={vals[f.id]} setValue={(v) => setV(f.id, v)} setSibling={(s, v) => setV(`${f.id}__${s}`, v)} />);
            i += 1;
          }
        }
        return out;
      })()}
      <div className="form-actions">
        <button type="button" className="ps-btn ps-btn--secondary ps-btn--lg" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Cancel</button>
        <button type="button" className="ps-btn ps-btn--cta ps-btn--lg" style={{ flex: 2, justifyContent: "center", opacity: missing.length ? 0.5 : 1 }} onClick={submit}>{def.submit}</button>
      </div>
    </div>
  );
}

export { Field, ComboField, AvatarField };
