"use client";

/* COMPVSS Field — mobile form system. Data-driven full-screen forms.
   Ported from the prototype's FormScreen + Field/ComboField/AvatarField. */

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { KIcon } from "./icon";
import { FORMS } from "./forms";
import type { FormDef, FormField } from "./forms";

// Severity tiers: High/Urgent = red, Medium = orange, Low = yellow. [bg, text]
export const TIER_COLOR: Record<string, [string, string]> = {
  High: ["var(--p-danger)", "#fff"],
  Urgent: ["var(--p-danger)", "#fff"],
  Medium: ["#ef7d22", "#fff"],
  Low: ["#edc23a", "#241a04"],
};

type AvatarValue = { img: boolean; zoom: number; pos: number } | null;

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
          <div style={{ position: "fixed", inset: 0, zIndex: 5 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 6, background: "var(--p-surface)", border: "1px solid var(--p-border)", borderRadius: 12, boxShadow: "var(--p-elev-2, var(--p-elev-1))", maxHeight: 200, overflowY: "auto" }}>
            {matches.length ? (
              matches.map((o) => (
                <div
                  key={o}
                  onClick={() => {
                    setValue(o);
                    setQ(o);
                    setOpen(false);
                  }}
                  style={{ padding: "11px 14px", fontSize: 14, cursor: "pointer", borderBottom: "1px solid var(--p-border)", color: value === o ? "var(--p-accent-text)" : "var(--p-text-1)", fontWeight: value === o ? 700 : 400 }}
                >
                  {o}
                </div>
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

// Avatar upload with an inline crop/save flow.
function AvatarField({ value, setValue }: { value: unknown; setValue: (v: unknown) => void }) {
  const [stage, setStage] = useState<"view" | "crop">("view");
  const [zoom, setZoom] = useState(1.2);
  const [pos, setPos] = useState(0);
  const av = (value as AvatarValue) || null;
  const has = !!(av && av.img);
  if (stage === "crop") {
    return (
      <div className="avatar-crop">
        <div className="ac-stage">
          <div className="ac-photo" style={{ transform: `translateX(${pos}px) scale(${zoom})` }} />
          <div className="ac-mask" />
        </div>
        <div className="fld" style={{ marginBottom: 8 }}>
          <label>Zoom</label>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
        </div>
        <div className="fld" style={{ marginBottom: 12 }}>
          <label>Position</label>
          <input type="range" min="-60" max="60" step="1" value={pos} onChange={(e) => setPos(parseInt(e.target.value))} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="ps-btn ps-btn--secondary ps-btn--lg" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStage("view")}>Cancel</button>
          <button type="button" className="ps-btn ps-btn--cta ps-btn--lg" style={{ flex: 1, justifyContent: "center" }} onClick={() => { setValue({ img: true, zoom, pos }); setStage("view"); }}><KIcon name="Check" size={15} /> Save</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <span className="avatar-up" onClick={() => setStage("crop")}>
        {has ? <span className="avatar-up-img" style={{ transform: `translateX(${av!.pos}px) scale(${av!.zoom})` }} /> : <span style={{ fontFamily: "var(--p-mono)", fontWeight: 700 }}>RT</span>}
        <span className="avatar-up-badge"><KIcon name="Camera" size={13} /></span>
      </span>
      <div>
        <button type="button" className="ps-btn ps-btn--secondary" onClick={() => setStage("crop")}><KIcon name="Upload" size={14} /> {has ? "Change Photo" : "Upload Photo"}</button>
        {has && <button type="button" className="ac-remove" onClick={() => setValue(null)}>Remove</button>}
      </div>
    </div>
  );
}

function Field({ f, value, setValue }: { f: FormField; value: unknown; setValue: (v: unknown) => void }) {
  const common = {
    value: (value as string | number | undefined) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValue(e.target.value),
  };
  let control: React.ReactNode;
  if (f.type === "avatar") control = <AvatarField value={value} setValue={setValue} />;
  else if (f.type === "textarea") control = <textarea {...common} placeholder={f.placeholder} />;
  else if (f.type === "select")
    control = (
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
      <div className="switch" data-on={value ? "1" : undefined} onClick={() => setValue(!value)}><span className="knob" /></div>
    );
  else if (f.type === "photo" || f.type === "file")
    control = (
      <div className="dropz" onClick={() => setValue(((value as number) || 0) + 1)}>
        <KIcon name={f.type === "photo" ? "Camera" : "Paperclip"} size={22} />
        <span>{value ? `${value} ${f.type === "photo" ? "photo" : "file"}${(value as number) > 1 ? "s" : ""} added` : `Tap to ${f.type === "photo" ? "capture or upload" : "attach"}`}</span>
      </div>
    );
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
}: {
  formId?: string;
  def?: FormDef;
  initial?: Record<string, unknown>;
  onClose: () => void;
  onSubmit: (def: FormDef, vals: Record<string, unknown>) => void;
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
  const setV = (id: string, v: unknown) => setVals((p) => ({ ...p, [id]: v }));
  const isReq = (f: FormField) => f.required || (f.requiredFor && f.requiredFor.includes(vals.cat as string));
  const missing = def.fields.filter((f) => isReq(f) && !vals[f.id]);
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
                <Field f={f} value={vals[f.id]} setValue={(v) => setV(f.id, v)} />
                <Field f={next} value={vals[next.id]} setValue={(v) => setV(next.id, v)} />
              </div>
            );
            i += 2;
          } else {
            out.push(<Field key={i} f={f} value={vals[f.id]} setValue={(v) => setV(f.id, v)} />);
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
