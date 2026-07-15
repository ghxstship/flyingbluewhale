import { describe, expect, it } from "vitest";
import { toFormData } from "./form-data";

/**
 * The regression this exists for: `fd.set(k, String(val))` turned a File
 * into the literal string "[object File]", so the server action received
 * text where it expected an upload — the mechanical cause of the incident
 * form's phantom photos.
 */
describe("toFormData", () => {
  const file = (name: string) => new File([new Uint8Array([1, 2, 3])], name, { type: "image/jpeg" });

  it("appends a File as a File, never as a string", () => {
    const fd = toFormData({ photo: file("a.jpg") });
    const got = fd.get("photo");
    expect(got).toBeInstanceOf(File);
    expect(got).not.toBe("[object File]");
  });

  it("appends every File in an array under a repeated key", () => {
    const fd = toFormData({ photo: [file("a.jpg"), file("b.jpg"), file("c.jpg")] });
    const all = fd.getAll("photo");
    expect(all).toHaveLength(3);
    expect(all.every((f) => f instanceof File)).toBe(true);
    expect((all[0] as File).name).toBe("a.jpg");
  });

  it("sends the avatar's pixels, not its wrapper object", () => {
    const fd = toFormData({ avatar: { file: file("me.jpg"), zoom: 1.4, pos: -12 } });
    expect(fd.get("avatar")).toBeInstanceOf(File);
  });

  it("still serialises scalars and booleans the way actions expect", () => {
    const fd = toFormData({ what: "spill in bay 3", injury: true, anon: false, count: 4 });
    expect(fd.get("what")).toBe("spill in bay 3");
    expect(fd.get("injury")).toBe("1");
    expect(fd.get("anon")).toBe("");
    expect(fd.get("count")).toBe("4");
  });

  it("drops null and undefined rather than sending the string 'null'", () => {
    const fd = toFormData({ a: null, b: undefined, c: "keep" });
    expect(fd.has("a")).toBe(false);
    expect(fd.has("b")).toBe(false);
    expect(fd.get("c")).toBe("keep");
  });
});
