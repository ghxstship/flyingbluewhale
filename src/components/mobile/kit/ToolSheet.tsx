"use client";

/* COMPVSS Field — digital toolbox. Field utilities that open in a bottom sheet:
   unit converter, ops calculator, OSHA standards, venue weather, radio channels,
   safety checklist. Ported verbatim from the prototype ToolSheet. */

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { KIcon } from "./icon";
import { SheetHead } from "./SheetHead";
import { useDismissable } from "./useDismissable";
import { toneToBadge } from "./badge";
import { useFormatters } from "@/lib/i18n/LocaleProvider";

export type Toast = (t: { tone: string; title: string; message?: string }) => void;

export type Tool = { id: string; label: string; icon: string; tint: string };

export const TOOLS: Tool[] = [
  { id: "unit", label: "Unit Converter", icon: "Ruler", tint: "info" },
  { id: "ops", label: "Ops Calculator", icon: "Calculator", tint: "accent" },
  { id: "osha", label: "OSHA Standards", icon: "BookOpen", tint: "warning" },
  { id: "weather", label: "Venue Weather", icon: "CloudSun", tint: "info" },
  { id: "radio", label: "Radio Channels", icon: "RadioTower", tint: "success" },
  { id: "checklist", label: "Safety Checklists", icon: "ClipboardCheck", tint: "accent" },
];

// ── Unit converter ──
export const UNITS: Record<string, Record<string, number>> = {
  Length: { ft: 0.3048, m: 1, in: 0.0254, cm: 0.01, yd: 0.9144, mi: 1609.34, km: 1000 },
  Weight: { lb: 0.453592, kg: 1, oz: 0.0283495, ton: 907.185, t: 1000 },
  Area: { "ft²": 0.092903, "m²": 1, "yd²": 0.836127, acre: 4046.86 },
  Speed: { mph: 0.44704, "km/h": 0.277778, "m/s": 1, kn: 0.514444 },
  Power: { W: 1, kW: 1000, hp: 745.7, "BTU/h": 0.293071, VA: 1 },
};

function UnitTool() {
  const CATS = ["Length", "Weight", "Area", "Speed", "Power", "Temp"];
  const [cat, setCat] = useState("Length");
  const [val, setVal] = useState("10");
  const unitsFor = (c: string) => (c === "Temp" ? ["°F", "°C", "K"] : Object.keys(UNITS[c] || {}));
  const units = unitsFor(cat);
  const [from, setFrom] = useState(units[0] || "");
  const [to, setTo] = useState(units[1] || "");
  useEffect(() => {
    const u = unitsFor(cat);
    setFrom(u[0] || "");
    setTo(u[1] || "");
  }, [cat]);
  const toC = (n: number, u: string) => (u === "°F" ? ((n - 32) * 5) / 9 : u === "K" ? n - 273.15 : n);
  const fromC = (c: number, u: string) => (u === "°F" ? (c * 9) / 5 + 32 : u === "K" ? c + 273.15 : c);
  const out = (() => {
    const n = parseFloat(val);
    if (isNaN(n)) return "—";
    if (cat === "Temp") return fromC(toC(n, from), to).toFixed(1);
    const table = UNITS[cat] || {};
    const f = table[from] ?? 1,
      t = table[to] ?? 1;
    return ((n * f) / t).toFixed(4).replace(/\.?0+$/, "");
  })();
  return (
    <div>
      <div className="chips" style={{ paddingBottom: 12 }}>{CATS.map((c) => <button key={c} type="button" className={`chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}</div>
      <div className="fld"><label htmlFor="conv-val">Value</label><input id="conv-val" type="number" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} /></div>
      <div className="frow">
        <div className="fld"><label htmlFor="conv-from">From</label><select id="conv-from" value={from} onChange={(e) => setFrom(e.target.value)}>{units.map((u) => <option key={u}>{u}</option>)}</select></div>
        <div className="fld"><label htmlFor="conv-to">To</label><select id="conv-to" value={to} onChange={(e) => setTo(e.target.value)}>{units.map((u) => <option key={u}>{u}</option>)}</select></div>
      </div>
      <div className="tool-out">{out}<span> {to}</span></div>
    </div>
  );
}

// ── Ops calculator — a menu of preconfigured field-ops calculators ──
export type OpsCalcDef = { id: string; name: string; icon: string; desc: string };
export const OPS_CALCS: OpsCalcDef[] = [
  { id: "occupancy", name: "Occupancy Load", icon: "Users", desc: "Max occupants from usable area" },
  { id: "density", name: "Crowd Density", icon: "UsersRound", desc: "Persons per m² · surge risk" },
  { id: "staffing", name: "Staffing Ratio", icon: "UserCheck", desc: "Staff needed for attendance" },
  { id: "throughput", name: "Gate Throughput", icon: "ScanLine", desc: "Entry time for a crowd" },
  { id: "power", name: "Power Load", icon: "Zap", desc: "Watts to amps · breaker size" },
  { id: "barstock", name: "Bar Stock", icon: "Wine", desc: "Servings & cases needed" },
  { id: "restroom", name: "Restroom Count", icon: "Toilet", desc: "Standard · VIP · ADA units" },
];

function OpsCalc({ id, back }: { id: string; back: () => void }) {
  const fmt = useFormatters();
  const [a, setA] = useState("2000");
  const [b, setB] = useState("");
  const [factor, setFactor] = useState(5);
  const [ratio, setRatio] = useState(100);
  const n1 = parseFloat(a),
    n2 = parseFloat(b);
  const def = OPS_CALCS.find((c) => c.id === id)!;
  let result = "—",
    unit = "",
    hint = "";
  let flag: { t: string; tone: string } | null = null;
  let body: ReactNode = null;
  if (id === "occupancy") {
    result = isNaN(n1) ? "—" : fmt.number(Math.floor(n1 / factor));
    unit = "max occupants";
    hint = `Load factor ${factor} sq ft / person. Verify vs. posted certificate.`;
    body = (
      <>
        <div className="fld"><label htmlFor="oc-area">Usable Area (sq ft)</label><input id="oc-area" type="number" inputMode="decimal" value={a} onChange={(e) => setA(e.target.value)} /></div>
        <div className="fld"><span className="fld-label" id="oc-use-label">Use</span><div className="seg2" role="group" aria-labelledby="oc-use-label">{([["Standing", 5], ["Seated", 7], ["Tables", 15]] as [string, number][]).map(([l, f]) => <button key={f} type="button" className={factor === f ? "on" : ""} onClick={() => setFactor(f)}>{l}</button>)}</div></div>
      </>
    );
  }
  if (id === "density") {
    const d = isNaN(n1) || isNaN(n2) || !n2 ? NaN : n1 / n2;
    result = isNaN(d) ? "—" : d.toFixed(1);
    unit = "persons / m²";
    if (!isNaN(d)) flag = d > 5 ? { t: "Stop entry", tone: "warn" } : d > 4 ? { t: "Restrict flow", tone: "warn" } : { t: "Within limits", tone: "ok" };
    hint = "Above 4 p/m² restrict flow · above 5 stop entry.";
    body = <div className="frow"><div className="fld"><label htmlFor="dn-people">People</label><input id="dn-people" type="number" value={a} onChange={(e) => setA(e.target.value)} /></div><div className="fld"><label htmlFor="dn-area">Area (m²)</label><input id="dn-area" type="number" value={b} onChange={(e) => setB(e.target.value)} /></div></div>;
  }
  if (id === "staffing") {
    result = isNaN(n1) ? "—" : fmt.number(Math.ceil(n1 / ratio));
    unit = "staff needed";
    hint = "Round up · add 10–15% relief for breaks.";
    body = (
      <>
        <div className="fld"><label htmlFor="st-att">Expected Attendance</label><input id="st-att" type="number" value={a} onChange={(e) => setA(e.target.value)} /></div>
        <div className="fld"><span className="fld-label" id="st-ratio-label">Ratio</span><div className="seg2" role="group" aria-labelledby="st-ratio-label">{([["Security 1:100", 100], ["Medical 1:1k", 1000], ["Bar 1:75", 75]] as [string, number][]).map(([l, r]) => <button key={r} type="button" className={ratio === r ? "on" : ""} onClick={() => setRatio(r)}>{l}</button>)}</div></div>
      </>
    );
  }
  if (id === "throughput") {
    const lanes = n2 || 1;
    const perLaneRate = 20;
    const mins = isNaN(n1) ? NaN : n1 / (lanes * perLaneRate);
    result = isNaN(mins) ? "—" : fmt.number(Math.ceil(mins));
    unit = "minutes to clear";
    hint = "Assumes ~20 scans/lane/min. Open more lanes to cut wait.";
    body = <div className="frow"><div className="fld"><label htmlFor="tp-crowd">Crowd Size</label><input id="tp-crowd" type="number" value={a} onChange={(e) => setA(e.target.value)} /></div><div className="fld"><label htmlFor="tp-lanes">Open Lanes</label><input id="tp-lanes" type="number" value={b} placeholder="1" onChange={(e) => setB(e.target.value)} /></div></div>;
  }
  if (id === "power") {
    const amps = isNaN(n1) ? NaN : n1 / (n2 || 120);
    result = isNaN(amps) ? "—" : amps.toFixed(1);
    unit = "amps";
    if (!isNaN(amps)) flag = amps > 16 ? { t: "Use 20A circuit", tone: "warn" } : { t: "15A OK", tone: "ok" };
    hint = "Watts ÷ volts = amps. Stay under 80% of breaker rating.";
    body = <div className="frow"><div className="fld"><label htmlFor="pw-watts">Total Watts</label><input id="pw-watts" type="number" value={a} onChange={(e) => setA(e.target.value)} /></div><div className="fld"><label htmlFor="pw-volts">Volts</label><input id="pw-volts" type="number" value={b} placeholder="120" onChange={(e) => setB(e.target.value)} /></div></div>;
  }
  if (id === "barstock") {
    const servings = isNaN(n1) ? NaN : Math.round(n1 * (n2 || 2));
    const cases = isNaN(servings) ? NaN : Math.ceil(servings / 24);
    result = isNaN(cases) ? "—" : fmt.number(cases);
    unit = "cases (24/ea)";
    hint = isNaN(servings) ? "" : `~${fmt.number(servings)} servings. Adjust drinks/guest for the crowd.`;
    body = <div className="frow"><div className="fld"><label htmlFor="bs-guests">Guests</label><input id="bs-guests" type="number" value={a} onChange={(e) => setA(e.target.value)} /></div><div className="fld"><label htmlFor="bs-drinks">Drinks / Guest</label><input id="bs-drinks" type="number" value={b} placeholder="2" onChange={(e) => setB(e.target.value)} /></div></div>;
  }
  if (id === "restroom") {
    // Kit 31: Standard 1:100 · VIP 1:50 · ADA = 5% of standard (min 1, per
    // ADAAG) · +25% units for events longer than 6 hours.
    const hrs = n2 || 6;
    const durF = hrs > 6 ? 1.25 : 1;
    const std = isNaN(n1) ? NaN : Math.ceil((n1 / 100) * durF);
    const vip = isNaN(n1) ? NaN : Math.ceil((n1 / 50) * durF);
    const ada = isNaN(std) ? NaN : Math.max(1, Math.ceil(std * 0.05));
    const sel = ratio === 50 ? vip : ratio === 20 ? ada : std;
    result = isNaN(sel) ? "—" : fmt.number(sel);
    unit = ratio === 50 ? "VIP units" : ratio === 20 ? "ADA units" : "standard units";
    hint = isNaN(std)
      ? "Add attendance to size the compound."
      : `Full compound: ${std} standard · ${vip} VIP (all-VIP zone) · ${ada} ADA. ADA = 5% of standard, min 1, on accessible routes.`;
    body = (
      <>
        <div className="frow"><div className="fld"><label htmlFor="rr-att">Attendance</label><input id="rr-att" type="number" value={a} onChange={(e) => setA(e.target.value)} /></div><div className="fld"><label htmlFor="rr-hrs">Event Hours</label><input id="rr-hrs" type="number" value={b} placeholder="6" onChange={(e) => setB(e.target.value)} /></div></div>
        <div className="fld"><span className="fld-label" id="rr-tier-label">Tier</span><div className="seg2" role="group" aria-labelledby="rr-tier-label">{([["Standard 1:100", 100], ["VIP 1:50", 50], ["ADA 5%", 20]] as [string, number][]).map(([l, r]) => <button key={r} type="button" className={ratio === r ? "on" : ""} onClick={() => setRatio(r)}>{l}</button>)}</div></div>
      </>
    );
  }
  return (
    <div>
      <button type="button" className="backbtn" onClick={back}><KIcon name="ChevronLeft" size={17} /> Calculators</button>
      <div style={{ fontWeight: 700, fontSize: 15, margin: "2px 0 12px" }}>{def.name}</div>
      {body}
      <div className="tool-out">{result}<span> {unit}</span></div>
      {flag && <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><span className={toneToBadge(flag.tone)}>{flag.t}</span></div>}
      <div className="hint" style={{ textAlign: "center" }}>{hint}</div>
    </div>
  );
}

function OpsTool() {
  const [calc, setCalc] = useState<string | null>(null);
  if (calc) return <OpsCalc id={calc} back={() => setCalc(null)} />;
  return (
    <div className="emerg-list">
      {OPS_CALCS.map((c) => (
        <button type="button" className="emerg-row" key={c.id} onClick={() => setCalc(c.id)} style={{ gap: 12 }}>
          <span className="more-ic" style={{ width: 34, height: 34, color: "var(--p-accent-text)" }}><KIcon name={c.icon} size={17} /></span>
          <span style={{ flex: 1, textAlign: "left" }}><span style={{ display: "block", fontWeight: 700, fontSize: 14 }}>{c.name}</span><span className="s">{c.desc}</span></span>
          <KIcon name="ChevronRight" size={15} style={{ color: "var(--p-text-3)", flex: "none" }} />
        </button>
      ))}
    </div>
  );
}

// ── OSHA standards (searchable) ──
export type OshaStandard = { code: string; t: string; s: string; url: string };
export const OSHA: OshaStandard[] = [
  { code: "1910.95", t: "Occupational Noise Exposure", s: "Hearing protection · 85 dBA action level", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.95" },
  { code: "1926.501", t: "Fall Protection", s: "Duty to have protection · 6 ft trigger", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.501" },
  { code: "1910.157", t: "Portable Fire Extinguishers", s: "Placement, inspection & use", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.157" },
  { code: "1910.36", t: "Means of Egress", s: "Exit routes, capacity & marking", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.36" },
  { code: "1926.451", t: "Scaffolding · General", s: "Staging, rigging & guardrails", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.451" },
  { code: "1910.147", t: "Lockout / Tagout", s: "Control of hazardous energy", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147" },
  { code: "1910.1200", t: "Hazard Communication", s: "Labels & safety data sheets", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1200" },
  { code: "1926.95", t: "Personal Protective Equipment", s: "PPE selection & use", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.95" },
];

function OshaTool({ toast }: { toast: Toast }) {
  const [q, setQ] = useState("");
  const items = OSHA.filter((o) => !q || (o.code + " " + o.t + " " + o.s).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="searchbar" style={{ marginBottom: 12 }}><KIcon name="Search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search standards…" /></div>
      {items.map((o, i) => (
        <button type="button" className="item tap" key={i} style={{ cursor: "pointer", width: "100%", textAlign: "left", font: "inherit", color: "inherit" }} onClick={() => { window.open(o.url, "_blank", "noopener"); toast({ tone: "info", title: `OSHA ${o.code}`, message: "Opening osha.gov" }); }}>
          <span className="tool-code">{o.code}</span>
          <div><div className="t">{o.t}</div><div className="s">{o.s}</div></div>
          <span className="sp" /><KIcon name="ExternalLink" size={15} style={{ color: "var(--p-text-3)" }} />
        </button>
      ))}
      {!items.length && <div className="hint" style={{ textAlign: "center", padding: "16px 0" }}>No standards match.</div>}
    </div>
  );
}

export const HOURLY: [string, string, string][] = [
  ["Now", "82°", "Sun"],
  ["4 PM", "83°", "Sun"],
  ["6 PM", "80°", "CloudSun"],
  ["8 PM", "77°", "Cloud"],
  ["10 PM", "74°", "CloudMoon"],
];
export const ICON_FOR: Record<string, string> = { Sun: "Sun", CloudSun: "CloudSun", Cloud: "Cloud", CloudMoon: "CloudMoon" };
export const CHANNELS: [string, string][] = [
  ["1", "Emergency"], ["2", "Security"], ["3", "Site Ops"], ["4", "Exterior Ops"],
  ["5", "Power & IT"], ["6", "Cleaning & Sanitation"], ["7", "Stage Ops"], ["8", "Audio"],
  ["9", "Lighting"], ["10", "Video & SFX"], ["11", "Experience"], ["12", "Site Lighting"],
  ["13", "Artist Relations"], ["14", "Guest Services"], ["15", "Bar Ops"], ["16", "VIP Ops"],
];

// OSHA-grade inspection checklist library — experiential production, construction
// job sites, and venue management. Configured by org/project admins.
export type Checklist = { id: string; team: string; name: string; icon: string; items: string[] };
export const CHECKLISTS: Checklist[] = [
  { id: "stage", team: "Experiential Production", name: "Stage & Decking", icon: "Drama", items: ["Decking pinned & load-rated", "Guardrails / toe-boards on edges ≥4 ft", "Stair units secured with handrails", "Skirting flame-rated", "Spike marks & sightlines clear", "No trip hazards on deck"] },
  { id: "rigging", team: "Experiential Production", name: "Rigging & Motors (1926.251)", icon: "Anchor", items: ["Motors & chain inspected, tagged", "Slings / shackles WLL verified", "Secondary safeties fitted", "Load calcs signed by rigger", "Exclusion zone under loads", "Daily pre-use rig check logged"] },
  { id: "lighting", team: "Experiential Production", name: "Lighting & Truss", icon: "Lightbulb", items: ["Truss pinned & spanner-checked", "Fixture safety cables installed", "Cable runs strain-relieved", "Hot work / haze cleared with fire", "Working & egress lighting tested", "Ground stacks ballasted"] },
  { id: "audio", team: "Experiential Production", name: "Audio & Power Distro", icon: "Volume2", items: ["Distro GFCI-protected & grounded", "Cable ramps over walkways", "SPL limits posted & monitored", "Line array safeties / spanset", "Hearing protection available", "Stinger loads within rating"] },
  { id: "pyro", team: "Experiential Production", name: "Pyro & SFX", icon: "Sparkles", items: ["Licensed operator on site", "Fallout zone established & clear", "Extinguishers staged at firing", "Permits & AHJ sign-off on file", "Misfire procedure briefed", "Comms with stage management live"] },

  { id: "fall", team: "Site Operations", name: "Fall Protection (1926.501)", icon: "ArrowDownToLine", items: ["Protection in place ≥6 ft", "Harness & lanyard inspected", "Anchor points rated 5,000 lb", "Leading edges guarded", "Floor openings covered & marked", "Rescue plan in place"] },
  { id: "scaffold", team: "Site Operations", name: "Scaffolding (1926.451)", icon: "Construction", items: ["Base plates & mud sills set", "Fully planked, no gaps >1 in", "Guardrails on open sides", "Access ladder / stair fitted", "Inspected & tagged by competent person", "Not within 10 ft of power lines"] },
  { id: "ladders", team: "Site Operations", name: "Ladders & Stairways (1926.1053)", icon: "TableRowsSplit", items: ["Right ladder for the task", "Inspected, no defects", "Secured / footed, 4:1 angle", "Extends 3 ft above landing", "3-point contact maintained", "Stairways guarded & lit"] },
  { id: "tools", team: "Site Operations", name: "Power Tools & Equipment", icon: "Wrench", items: ["Guards in place & functional", "Cords / plugs undamaged", "Tools rated for environment", "Operators trained & authorized", "Defective tools tagged out", "Battery storage / charging safe"] },
  { id: "loto", team: "Site Operations", name: "Lockout / Tagout (1910.147)", icon: "Lock", items: ["Energy sources identified", "Locks & tags applied", "Stored energy released", "Zero-energy verified", "Only authorized employee removes", "Group lockout box used"] },
  { id: "ppe", team: "Site Operations", name: "PPE & Hazard Comm", icon: "HardHat", items: ["Hard hats in active zones", "Eye / hearing protection worn", "Hi-vis in traffic / dock areas", "Cut & impact gloves available", "SDS binder accessible (1910.1200)", "Chemical labels intact"] },

  { id: "egress", team: "Venue Management", name: "Means of Egress (1910.36)", icon: "DoorOpen", items: ["Exits unlocked & unobstructed", "Exit signs illuminated", "Aisle widths maintained", "Egress capacity vs. occupancy", "Emergency lighting tested", "Exit discharge clear to public way"] },
  { id: "fire", team: "Venue Management", name: "Fire & Life Safety (1910.157)", icon: "Flame", items: ["Extinguishers charged & accessible", "Fire lanes unobstructed", "Standpipe / hydrant access clear", "Sprinkler heads unobstructed", "Pyrotechnic / open-flame permits", "Alarm & PA tested"] },
  { id: "occupancy", team: "Venue Management", name: "Occupancy & Crowd", icon: "Users", items: ["Posted occupant load not exceeded", "Counting / scan system live", "Crowd density monitored", "Barricade & queue plan set", "Re-entry / one-way flow defined", "Surge response briefed"] },
  { id: "sanitation", team: "Venue Management", name: "Sanitation & Restrooms", icon: "Trash2", items: ["Restrooms stocked & accessible", "Hand-wash / sanitizer stations", "Waste & recycling streams set", "Spill kits available", "Potable water access", "Vector / pest control checked"] },
  { id: "food", team: "Venue Management", name: "Food Safety (Catering)", icon: "Utensils", items: ["Hot ≥135°F / cold ≤41°F logged", "Allergen labeling posted", "Hand-wash sinks supplied", "Cross-contamination controls", "Permits / health cert displayed", "Cleaning & sanitizing schedule"] },
  { id: "ada", team: "Venue Management", name: "ADA & Accessibility", icon: "Accessibility", items: ["Accessible routes unobstructed", "ADA seating / companion held", "Ramps & lifts operational", "Accessible restrooms available", "Signage & wayfinding clear", "Service-animal relief area set"] },
];
export const CHECKLIST_TEAMS = ["Experiential Production", "Site Operations", "Venue Management"];

function ChecklistTool({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [open, setOpen] = useState<Checklist | null>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  if (!open) {
    return (
      <div>
        {CHECKLIST_TEAMS.filter((tm) => CHECKLISTS.some((c) => c.team === tm)).map((tm) => (
          <div key={tm}>
            <div className="grph">{tm}<span className="gc">{CHECKLISTS.filter((c) => c.team === tm).length}</span></div>
            <div className="emerg-list" style={{ marginBottom: 10 }}>
              {CHECKLISTS.filter((c) => c.team === tm).map((c) => (
                <button type="button" className="emerg-row" key={c.id} onClick={() => { setOpen(c); setChecked({}); }} style={{ gap: 12 }}>
                  <span className="more-ic" style={{ width: 34, height: 34, color: "var(--p-accent-text)" }}><KIcon name={c.icon} size={17} /></span>
                  <span style={{ flex: 1, textAlign: "left" }}><span style={{ display: "block", fontWeight: 700, fontSize: 14 }}>{c.name}</span><span className="s">{c.items.length} checks</span></span>
                  <KIcon name="ChevronRight" size={15} style={{ color: "var(--p-text-3)", flex: "none" }} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  const done = Object.values(checked).filter(Boolean).length;
  const all = done === open.items.length;
  return (
    <div>
      <button type="button" className="backbtn" onClick={() => setOpen(null)}><KIcon name="ChevronLeft" size={17} /> Departments</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0 10px" }}><div style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{open.name}</div><span className="hint">{done}/{open.items.length}</span></div>
      {open.items.map((c, i) => (
        <button type="button" role="checkbox" aria-checked={!!checked[i]} className="item tap" key={i} style={{ cursor: "pointer", width: "100%", textAlign: "left", font: "inherit", color: "inherit" }} onClick={() => setChecked((p) => ({ ...p, [i]: !p[i] }))}>
          <span className="check" data-on={checked[i] ? "1" : undefined}>{checked[i] && <KIcon name="Check" size={14} />}</span>
          <div><div className="t" style={{ textDecoration: checked[i] ? "line-through" : "none", opacity: checked[i] ? 0.55 : 1 }}>{c}</div></div>
        </button>
      ))}
      <button type="button" className={`ps-btn ${all ? "ps-btn--cta" : "ps-btn--secondary"} ps-btn--lg`} style={{ width: "100%", justifyContent: "center", marginTop: 14 }} onClick={() => { if (all) { toast({ tone: "ok", title: "Checklist submitted", message: open.name + " · logged" }); onClose(); } else { setOpen(null); } }}>{all ? "Submit Checklist" : "Back"}</button>
    </div>
  );
}

export function ToolSheet({ toolId, onClose, toast }: { toolId: string; onClose: () => void; toast: Toast }) {
  const tool = TOOLS.find((t) => t.id === toolId);
  const panelRef = useDismissable<HTMLDivElement>(!!tool, onClose);
  if (!tool) return null;
  return (
    <div className="sheet">
      <button type="button" className="sheet-bg" aria-label="Close" onClick={onClose} />
      <div ref={panelRef} className="sheet-panel" role="dialog" aria-modal="true" aria-label={tool.label}>
        <div className="sheet-grip" />
        {/* Kit 31 (live-test resolution #8): canonical SheetHead — icon +
            title + explicit ✕ close on every sheet. */}
        <SheetHead icon={tool.icon} title={tool.label} onClose={onClose} />
        {toolId === "unit" && <UnitTool />}
        {toolId === "ops" && <OpsTool />}
        {toolId === "osha" && <OshaTool toast={toast} />}
        {toolId === "weather" && (
          <div>
            <div className="hint" style={{ marginBottom: 10 }}>
              Sample conditions · connect a weather source for live venue data.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <KIcon name="Sun" size={40} style={{ color: "var(--p-warning)" }} />
              <div><div style={{ fontFamily: "var(--p-heading)", fontSize: 40, lineHeight: 1 }}>82°</div><div className="s">Clear · feels 85°</div></div>
            </div>
            <div className="chips" style={{ paddingBottom: 12, justifyContent: "space-between" }}>
              {HOURLY.map(([h, t, ic], i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: "none", minWidth: 52 }}>
                  <span className="s" style={{ fontSize: 11 }}>{h}</span><KIcon name={ICON_FOR[ic] || "Sun"} size={18} style={{ color: "var(--p-text-2)" }} /><span style={{ fontWeight: 700, fontSize: 12 }}>{t}</span>
                </div>
              ))}
            </div>
            <div className="rec-grid">
              <div className="rec-cell"><div className="rec-k">Wind</div><div className="rec-v">9 mph ESE</div></div>
              <div className="rec-cell"><div className="rec-k">Gusts</div><div className="rec-v">18 mph</div></div>
              <div className="rec-cell"><div className="rec-k">Humidity</div><div className="rec-v">64%</div></div>
              <div className="rec-cell"><div className="rec-k">UV Index</div><div className="rec-v">8 · High</div></div>
              <div className="rec-cell"><div className="rec-k">Sunset</div><div className="rec-v">7:48 PM</div></div>
              <div className="rec-cell"><div className="rec-k">Rain</div><div className="rec-v">10%</div></div>
            </div>
            <div className="item" style={{ marginTop: 4 }}><KIcon name="CircleCheck" size={18} style={{ color: "var(--p-success)" }} /><div><div className="t">No active weather holds</div><div className="s">Outdoor gates clear to open</div></div></div>
          </div>
        )}
        {toolId === "radio" && (
          <>
            <div className="hint" style={{ marginBottom: 10 }}>Radio channel plan · {CHANNELS.length} channels</div>
            {CHANNELS.map(([ch, label]) => (
              <div className="item" key={ch}><span className="tool-code">CH {ch}</span><div><div className="t">{label}</div></div></div>
            ))}
          </>
        )}
        {toolId === "checklist" && <ChecklistTool toast={toast} onClose={onClose} />}
        {toolId !== "checklist" && <button type="button" className="ps-btn ps-btn--secondary ps-btn--lg" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} onClick={onClose}>Done</button>}
      </div>
    </div>
  );
}
