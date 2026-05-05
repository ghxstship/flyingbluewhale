import { describe, it, expect } from "vitest";
import { parseMentions, renderMentionsToHtml } from "../collab/mentions";

describe("parseMentions", () => {
  it("matches @username at start of string", () => {
    const m = parseMentions("@alice please check");
    expect(m).toEqual([{ kind: "user", handle: "alice", start: 0, end: 6 }]);
  });

  it("matches @username after whitespace", () => {
    const m = parseMentions("hey @bob look");
    expect(m).toEqual([{ kind: "user", handle: "bob", start: 4, end: 8 }]);
  });

  it("matches @username at end of sentence with trailing punctuation", () => {
    const m = parseMentions("ping @alice .");
    expect(m).toEqual([{ kind: "user", handle: "alice", start: 5, end: 11 }]);
  });

  it("does not match emails", () => {
    expect(parseMentions("ping julian@ghxstship.pro").length).toBe(0);
    expect(parseMentions("contact julian@ghxstship.pro for details").length).toBe(0);
  });

  it("matches @team-* as team", () => {
    const m = parseMentions("Hey @team-prod review");
    expect(m).toEqual([{ kind: "team", handle: "prod", start: 4, end: 14 }]);
  });

  it("ignores @@bad", () => {
    expect(parseMentions("ignore @@bad input").length).toBe(0);
  });

  it("matches single-char @a handle", () => {
    const m = parseMentions("@a hi");
    expect(m).toEqual([{ kind: "user", handle: "a", start: 0, end: 2 }]);
  });

  it("captures multiple mentions", () => {
    const m = parseMentions("@alice and @bob plus @team-prod");
    expect(m).toEqual([
      { kind: "user", handle: "alice", start: 0, end: 6 },
      { kind: "user", handle: "bob", start: 11, end: 15 },
      { kind: "team", handle: "prod", start: 21, end: 31 },
    ]);
  });

  it("allows dots and underscores in handles", () => {
    const m = parseMentions("hi @first.last and @snake_case");
    expect(m.map((x) => x.handle)).toEqual(["first.last", "snake_case"]);
  });

  it("returns empty array for empty input", () => {
    expect(parseMentions("")).toEqual([]);
  });

  it("does not match @ at end with no handle", () => {
    expect(parseMentions("trailing @")).toEqual([]);
  });

  it("rejects oversized handles", () => {
    const tooLong = "@" + "a".repeat(50);
    expect(parseMentions(tooLong)).toEqual([]);
  });

  it("matches @username followed by punctuation", () => {
    const m = parseMentions("ok @alice, please review");
    expect(m).toEqual([{ kind: "user", handle: "alice", start: 3, end: 9 }]);
  });

  it("does not match when preceded by an identifier char", () => {
    expect(parseMentions("foo@bar baz")).toEqual([]);
  });
});

describe("renderMentionsToHtml", () => {
  it("escapes plain text with no mentions", () => {
    expect(renderMentionsToHtml("hello <b>world</b>", () => null)).toBe("hello &lt;b&gt;world&lt;/b&gt;");
  });

  it("renders resolved user mention as a span", () => {
    const out = renderMentionsToHtml("hi @alice", (m) =>
      m.kind === "user" && m.handle === "alice" ? { kind: "user", id: "u1", name: "Alice Smith" } : null,
    );
    expect(out).toBe('hi <span class="mention" data-kind="user" data-id="u1">@Alice Smith</span>');
  });

  it("leaves unresolved mentions as plain text", () => {
    const out = renderMentionsToHtml("hi @ghost", () => null);
    expect(out).toBe("hi @ghost");
  });

  it("renders team mentions with team kind", () => {
    const out = renderMentionsToHtml("see @team-prod", (m) =>
      m.kind === "team" ? { kind: "team", id: "t1", name: "Production" } : null,
    );
    expect(out).toBe('see <span class="mention" data-kind="team" data-id="t1">@Production</span>');
  });

  it("escapes content around mentions", () => {
    const out = renderMentionsToHtml("<b>hi</b> @a", (m) =>
      m.kind === "user" && m.handle === "a" ? { kind: "user", id: "u1", name: "A & B" } : null,
    );
    expect(out).toBe('&lt;b&gt;hi&lt;/b&gt; <span class="mention" data-kind="user" data-id="u1">@A &amp; B</span>');
  });
});
