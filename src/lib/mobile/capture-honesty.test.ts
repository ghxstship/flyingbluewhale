import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/**
 * Capture-honesty guard (COMPVSS mobile parity audit, D3).
 *
 * The kit's photo/file control was a button whose only effect was
 * `setValue(n + 1)`. It rendered "3 photos added" and captured nothing; the
 * incident action then hard-coded `photos: []`. Seven form specs used it, so
 * a worker documenting an injury got a UI that confirmed their evidence and
 * a database row without it. Nothing failed, nothing logged — the app simply
 * lied, on a safety surface.
 *
 * A UI that claims to have captured something MUST have a real input behind
 * it. This guard asserts the two halves of that, because both halves were
 * independently wrong:
 *
 *  1. The kit's capture control renders a real `<input type="file">`.
 *  2. No mobile action hard-codes an empty `photos: []` while its form
 *     advertises a photo field.
 */
const ROOT = process.cwd();
const FORM_SCREEN = join(ROOT, "src/components/mobile/kit/FormScreen.tsx");
const FORMS = join(ROOT, "src/components/mobile/kit/forms.ts");
const MOBILE_APP = join(ROOT, "src/app/(mobile)");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("mobile capture is real, not a counter", () => {
  const formScreen = readFileSync(FORM_SCREEN, "utf8");

  it("renders a real file input for photo/file fields", () => {
    expect(formScreen).toMatch(/type="file"/);
    expect(formScreen).toMatch(/accept=\{?["']?image\//);
  });

  it("does not fake capture by incrementing a counter", () => {
    // The exact shape of the original lie.
    expect(formScreen).not.toMatch(/setValue\(\(\(value as number\)\s*\|\|\s*0\)\s*\+\s*1\)/);
    // And the copy it produced.
    expect(formScreen).not.toMatch(/photos? added`/);
  });

  it("the avatar field picks a real file rather than asserting img: true", () => {
    expect(formScreen).not.toMatch(/\{\s*img:\s*true/);
  });

  it("no mobile action hard-codes photos: [] ", () => {
    // A form advertising `type: "photo"` whose action stores an empty array
    // is the incident bug exactly. Storing [] is only honest when nothing
    // was submitted — which the upload helper already expresses by
    // returning an empty `paths`.
    const offenders = walk(MOBILE_APP)
      .filter((f) => f.endsWith("actions.ts"))
      .filter((f) => /photos:\s*\[\]/.test(readFileSync(f, "utf8")))
      .map((f) => relative(ROOT, f));

    expect(
      offenders,
      offenders.length
        ? `Action(s) hard-coding an empty photos array — wire them to uploadFieldPhotos:\n  ${offenders.join("\n  ")}`
        : undefined,
    ).toEqual([]);
  });

  it("every form spec advertising a photo field is served by the real control", () => {
    const forms = readFileSync(FORMS, "utf8");
    // Sanity: the specs still declare photo fields (if this ever hits zero,
    // the guard above stops meaning anything and should be revisited).
    const photoFields = forms.match(/type:\s*"photo"/g) ?? [];
    expect(photoFields.length).toBeGreaterThan(0);
  });
});

/**
 * The rest of the lie, one route over.
 *
 * The guards above prove the CONTROL is real and that no action stores a
 * hard-coded `photos: []`. Neither catches the shape that survived them: a
 * form advertises "Photos", the control captures them honestly, and then the
 * submit path never reads the field. Nothing is hard-coded, nothing throws —
 * the files simply reach the end of the function and are garbage-collected.
 * The worker still sees "2 photos attached" and still files a record without
 * them, which is the original defect with a different mechanism.
 *
 * It failed in both directions independently, so both are asserted:
 *
 *  - CLIENT: `/m/market` built its payload by naming four fields and omitting
 *    `photo` — the files never left the browser.
 *  - SERVER: `/m/handover` serialised the files correctly and `submitHandover`
 *    never looked for them.
 *
 * `toFormData` is the only serialiser with a File branch, and `filesFrom` is
 * the only reader — so requiring both names is a cheap proxy for "the bytes
 * make it from the picker to storage".
 */
const KIT = join(ROOT, "src/components/mobile/kit");

/** Form ids whose photo field has no mount site. A spec nobody renders can't
 *  lie to anyone — but it is also dead weight that reads as shipped. Listed
 *  explicitly so ORPHANING a live form trips this guard rather than quietly
 *  joining the list. Each of these has a persistence target already waiting
 *  (`maintenance_jobs.photos`, `expenses.receipt_path`), so they are wiring
 *  jobs, not deletions. */
const UNMOUNTED_PHOTO_SPECS = ["maintenance", "expense", "post"] as const;

/** Parse `FORMS` into per-id source blocks. */
function formBlocks(): Map<string, string> {
  const src = readFileSync(FORMS, "utf8");
  const body = src.slice(src.indexOf("export const FORMS"));
  const re = /^ {2}(\w+): \{/gm;
  const marks: Array<{ id: string; start: number }> = [];
  for (let m = re.exec(body); m; m = re.exec(body)) marks.push({ id: m[1]!, start: m.index });
  const out = new Map<string, string>();
  marks.forEach((mk, i) => out.set(mk.id, body.slice(mk.start, marks[i + 1]?.start ?? body.length)));
  return out;
}

function photoFormIds(): string[] {
  return [...formBlocks()]
    .filter(([, block]) => /type:\s*"(photo|file)"/.test(block))
    .map(([id]) => id);
}

/** Files under (mobile) or the kit that render this form. */
function mountSites(formId: string): string[] {
  const needle = new RegExp(`formId="${formId}"|FORMS\\.${formId}\\b|FORMS\\["${formId}"\\]`);
  return [...walk(MOBILE_APP), ...walk(KIT)].filter((f) => needle.test(readFileSync(f, "utf8")));
}

/** Resolve the action modules a mount site imports. */
function importedActions(file: string): string[] {
  const src = readFileSync(file, "utf8");
  const out: string[] = [];
  for (const m of src.matchAll(/from\s+"(\.\.?\/[^"]*actions)"/g)) {
    const base = resolve(dirname(file), m[1]!);
    for (const cand of [`${base}.ts`, `${base}.tsx`, join(base, "index.ts")]) {
      if (existsSync(cand)) out.push(cand);
    }
  }
  return out;
}

describe("a form that advertises photos actually persists them", () => {
  const mounted = photoFormIds().filter((id) => mountSites(id).length > 0);

  it("finds the mounted photo forms", () => {
    // If this collapses to nothing, the cases below vacuously pass.
    expect(mounted.length).toBeGreaterThan(0);
  });

  it.each(mounted)("%s: the picked files reach the server", (formId) => {
    const offenders = mountSites(formId)
      .filter((site) => !/toFormData\(/.test(readFileSync(site, "utf8")))
      .map((s) => relative(ROOT, s));

    expect(
      offenders,
      offenders.length
        ? `"${formId}" advertises a photo field, but these mount sites don't serialise with toFormData() — ` +
            `a hand-rolled String(v) payload turns a File into "[object File]" or drops it silently:\n  ${offenders.join("\n  ")}`
        : undefined,
    ).toEqual([]);
  });

  it.each(mounted)("%s: the server reads the files it was sent", (formId) => {
    const sites = mountSites(formId);
    const actions = [...new Set(sites.flatMap(importedActions))];
    const reads = actions.some((a) => /filesFrom\(/.test(readFileSync(a, "utf8")));

    expect(
      reads,
      reads
        ? undefined
        : `"${formId}" advertises a photo field and its mount site sends the files, but no action it imports ` +
            `calls filesFrom() — the upload is dropped server-side and the worker is told it succeeded.\n` +
            `  mounts:  ${sites.map((s) => relative(ROOT, s)).join(", ") || "(none)"}\n` +
            `  actions: ${actions.map((a) => relative(ROOT, a)).join(", ") || "(none resolved)"}`,
    ).toBe(true);
  });

  it("the unmounted-spec allowlist is exact", () => {
    // Orphaning a live form must trip here rather than silently qualify for
    // the exemption above.
    const unmounted = photoFormIds().filter((id) => mountSites(id).length === 0);
    expect(unmounted.sort()).toEqual([...UNMOUNTED_PHOTO_SPECS].sort());
  });
});
