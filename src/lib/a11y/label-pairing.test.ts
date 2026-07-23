import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * A11Y ratchet — label/control pairing (W6, UIUX canon audit lane-c A11Y-1).
 *
 * The dominant broken idiom across the console's create/edit forms was a
 * `<label>` closed BEFORE its sibling `<select>`/`<textarea>`/`<input>` with
 * no `htmlFor`/`id` pair: no programmatic association, no click-to-focus,
 * invisible to screen readers and voice control. The W6 sweep added
 * `htmlFor` + a stable, name-derived `id` to every such pair in the
 * `(platform)` and `(mobile)` trees.
 *
 * Heuristic (mirrors the audit's reproduce sweep):
 *   flag every `<label>` opening tag WITHOUT `htmlFor` whose element does NOT
 *   wrap a form control (wrapping labels are fine — implicit association) and
 *   whose closing `</label>` is followed within 3 lines by a sibling native
 *   control (`<input|<select|<textarea`).
 *
 * PIN = 0. Do not raise this number: pair the label instead — add
 * `htmlFor="<field-name>"` on the label and a matching `id` on the control
 * (or wrap the control in the label). `Input`/`FormShell` already do this.
 */

const ROOT = process.cwd();
const SCAN_ROOTS = ["src/app/(platform)", "src/app/(mobile)"];
const PIN = 0;

/** Find the index of the ">" closing a JSX opening tag; brace/string aware so
 * `onChange={(e) => …}` inside attributes never terminates the tag early. */
function tagEnd(src: string, start: number): number {
  let depth = 0;
  let str: string | null = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i]!;
    if (str) {
      if (c === "\\") i++;
      else if (c === str) str = null;
    } else if (c === '"' || c === "'" || c === "`") str = c;
    else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return i;
  }
  return -1;
}

const WRAPPED_CONTROL = /<(input|select|textarea|Input|Select|Textarea|Combobox|Checkbox|Switch|Slider)\b/;
const SIBLING_CONTROL = /<(input|select|textarea)\b/;

function unpairedLabels(src: string): number[] {
  const lines = src.split("\n");
  const offenders: number[] = [];
  const re = /<label\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const start = m.index;
    const openEnd = tagEnd(src, start);
    if (openEnd === -1) continue;
    if (/htmlFor/.test(src.slice(start, openEnd + 1))) continue;
    const close = src.indexOf("</label>", openEnd);
    if (close === -1) continue;
    if (WRAPPED_CONTROL.test(src.slice(openEnd + 1, close))) continue;
    const closeLine = src.slice(0, close).split("\n").length; // 1-based
    const after = lines.slice(closeLine, closeLine + 3).join("\n");
    if (SIBLING_CONTROL.test(after)) {
      offenders.push(src.slice(0, start).split("\n").length);
    }
  }
  return offenders;
}

function walk(dir: string, acc: string[]): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith(".tsx") && !p.includes(".test.")) acc.push(p);
  }
  return acc;
}

/**
 * PAT ratchet — one-click destructive forms (lane-c PAT-1).
 *
 * The 9 audit-flagged unconfirmed deletes (custom domains, RFQ response
 * lines, cues, daily-log photos, rentals, fabrication orders, custom roles,
 * CO lines, advancing presets) were moved onto `DeleteForm` (Radix confirm
 * dialog) in W6. The mechanical signal for the anti-pattern is a bare
 * `<form action={deleteX}>` / `<form action={removeX}>` — a hidden-input
 * form whose submit destroys data with no confirmation step.
 *
 * PIN = 8 pre-existing occurrences (settlement lines, packet sections /
 * audiences / assignments, scheduler availability, briefing attendees,
 * broadcast invites, BIM model links) that the audit did not class as
 * high-risk. Do not raise this number: new destructive actions ride
 * `DeleteForm` (add an id-arg wrapper action and bind it). Lowering the pin
 * when converting a site is encouraged.
 */
const DESTRUCTIVE_FORM = /<form action=\{(delete|remove)[A-Z]/g;
const DESTRUCTIVE_PIN = 8;

describe("pattern ratchet — unconfirmed destructive forms in (platform) + (mobile)", () => {
  it(`bare <form action={delete…|remove…}> stays at or below the pin (pin: ${DESTRUCTIVE_PIN})`, () => {
    const offenders: string[] = [];
    for (const rootDir of SCAN_ROOTS) {
      for (const file of walk(join(ROOT, rootDir), [])) {
        const src = readFileSync(file, "utf8");
        const count = src.match(DESTRUCTIVE_FORM)?.length ?? 0;
        if (count) offenders.push(`${file.slice(ROOT.length + 1)} ×${count}`);
      }
    }
    const total = offenders.reduce((a, o) => a + Number(o.split("×")[1]), 0);
    expect(
      total,
      `Bare destructive forms (use DeleteForm with a confirm instead):\n${offenders.join("\n")}`,
    ).toBeLessThanOrEqual(DESTRUCTIVE_PIN);
  });
});

describe("a11y ratchet — label/control pairing in (platform) + (mobile)", () => {
  it(`no <label> without htmlFor precedes a sibling control (pin: ${PIN})`, () => {
    const offenders: string[] = [];
    for (const rootDir of SCAN_ROOTS) {
      for (const file of walk(join(ROOT, rootDir), [])) {
        const hits = unpairedLabels(readFileSync(file, "utf8"));
        if (hits.length) {
          offenders.push(`${file.slice(ROOT.length + 1)}: line(s) ${hits.join(", ")}`);
        }
      }
    }
    expect(
      offenders,
      `Unpaired <label> before a sibling control (add htmlFor + id, or wrap the control):\n${offenders.join("\n")}`,
    ).toHaveLength(PIN);
  });
});
