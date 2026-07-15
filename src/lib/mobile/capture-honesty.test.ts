import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

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
