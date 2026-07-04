# ATLVS Email Kit

A self-contained, **no-React** kit for building transactional and campaign
emails as **table-based, fully-inline-styled HTML strings**. Every function is
a pure string builder — there is no JSX, no `react-dom/server`, no DOM, and no
`server-only` dependency, so the kit is safe to import anywhere (route
handlers, scripts, tests, previews).

## Why inline hex (and inline everything)

Email clients are **not browsers**. Gmail, Outlook (Word rendering engine),
Apple Mail, Yahoo, and the rest:

- **strip `<style>` blocks and `<link>`ed stylesheets** (inconsistently — Gmail
  keeps some, Outlook ignores most, others vary),
- **do not support CSS custom properties** — `var(--p-accent)` resolves to
  nothing, so the repo's `--p-*` token system simply cannot be used in email,
- **do not support flexbox/grid reliably** — Outlook lays out with HTML tables,
- **apply aggressive default styles** you must override locally.

The only thing that renders consistently everywhere is a **table-based layout
with every style written inline as a hard-coded hex / px literal**. That is why
this kit:

1. **Centralizes the palette** in `PALETTE` and the font stacks in `FONTS`
   (`blocks.ts`) — one place to edit — then
2. **inlines those literal strings** into every `style="..."` attribute.

The constants exist for source maintainability, **not** for runtime resolution.
There is no CSS-variable indirection in the output; if there were, most inboxes
would render unstyled email. Keep `PALETTE` in sync with
`src/app/theme/tokens.json` by hand.

## Files

| File           | Purpose                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| `blocks.ts`    | `PALETTE` + `FONTS` consts; composable block builders.                  |
| `layout.ts`    | `emailLayout({ preheader, body })` → full responsive 600px document.    |
| `templates.ts` | Ready templates: welcome / verify / invite / announcement.              |
| `registry.ts`  | `EMAIL_TEMPLATES` map (id → `{ label, render }`) for discoverability.   |
| `index.ts`     | Barrel re-export.                                                        |

## Blocks (`blocks.ts`)

- `emailButton({ label, href, tone? })` — bulletproof inline-block CTA anchor.
- `emailHeading(text, level?)` — Anton display (1/2), Hanken 700 (3).
- `emailText(html)` — body paragraph (accepts trusted inline HTML).
- `emailEyebrow(text)` — uppercase mono overline.
- `emailDivider()` — hairline rule.
- `emailSpacer(px)` — vertical whitespace (table-based for Outlook).
- `emailCodePanel(value, large?)` — boxed mono code / URL panel.
- `emailHeader(logoUrl?)` — header band (logo or spaced wordmark fallback).
- `emailFooter(orgName, address?)` — footer band + "Powered by ATLVS".
- `escapeHtml(value)` — HTML-escape caller text (builders apply it to labels).

> Text inputs (labels, names) are escaped automatically. Inputs documented as
> **HTML** (`emailText`, the announcement `body`) are emitted verbatim — escape
> first if they may contain user input.

## Layout (`layout.ts`)

```ts
import { emailLayout, emailHeading, emailText, emailButton } from "@/components/email";
import { urlFor } from "@/lib/urls";

const html = emailLayout({
  preheader: "Hidden inbox-snippet preview text",
  body: emailHeading("Hello") + emailText("Body copy") +
        emailButton({ label: "Go", href: urlFor("marketing", "/") }),
});
```

`emailLayout` is intentionally self-contained and does **not** call
`wrapEmailHtml` from `src/lib/email.ts`: that module is `import "server-only"`
(it pulls in the Resend sender + Supabase), which would make this pure
presentation kit unusable outside a server context. The layout mirrors the same
chrome contract (header → body → "Powered by ATLVS" footer), so its output is
visually interchangeable with `wrapEmailHtml`.

## Templates (`templates.ts`)

Each returns `{ subject, html }`:

```ts
welcomeEmail({ name, ctaUrl })
verifyEmail({ code, verifyUrl })
inviteEmail({ inviter, orgName, acceptUrl })
announcementEmail({ title, body, ctaLabel, ctaUrl })
```

## Sending

In a server context, hand the rendered HTML to the existing sender:

```ts
import { welcomeEmail } from "@/components/email";
import { sendEmail } from "@/lib/email";

const { subject, html } = welcomeEmail({ name: "Riley", ctaUrl });
await sendEmail({ to, subject, html });
```

## Registry (`registry.ts`)

`EMAIL_TEMPLATES` maps an id → `{ label, description, render, sample }` for
admin/preview surfaces. `render` takes a loose props bag; prefer the typed
template functions for production senders.

## Voice

ATLVS world-builder register — confident, warm in invitations, calm in the
chrome. No emoji, no competitor names. See `docs/brand/voice.md`.
