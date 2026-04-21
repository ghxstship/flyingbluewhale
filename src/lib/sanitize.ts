import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize untrusted HTML before rendering with
 * `dangerouslySetInnerHTML`. Used for proposal custom blocks, rich-text
 * editor output, and any other surface where an org member (or
 * compromised account) could persist HTML that a recipient later views.
 *
 * Policy: the subset of HTML a client proposal/deliverable/guide
 * reasonably needs — headings, lists, inline formatting, quotes,
 * images, links with `rel=noopener`, and a few data-oriented elements.
 * Script/style/iframe/object/form are always stripped; event handlers
 * (`onclick`, `onload`, …) are stripped by default config.
 *
 * DOMPurify is battle-tested and XSS-test-suite-covered. Running on
 * the server via jsdom (isomorphic-dompurify handles the environment).
 */
const ALLOWED_TAGS = [
  "a", "abbr", "b", "blockquote", "br", "code", "em", "figure", "figcaption",
  "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "kbd", "li", "mark",
  "ol", "p", "pre", "s", "small", "span", "strong", "sub", "sup",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "u", "ul",
];

const ALLOWED_ATTR = [
  "href", "title", "target", "rel",
  "src", "alt", "width", "height", "loading",
  "class", "id",
  "colspan", "rowspan",
];

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // `rel=noopener noreferrer` added to every external anchor.
    ADD_ATTR: ["rel"],
    // Don't leave empty wrappers or HTML comments behind.
    KEEP_CONTENT: false,
    USE_PROFILES: { html: true },
  });
}
