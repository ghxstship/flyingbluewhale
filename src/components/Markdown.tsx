import * as React from "react";

/**
 * Minimal markdown renderer — covers the syntax our knowledge base
 * actually uses: headings (#–######), paragraphs, unordered lists,
 * ordered lists, bold/italic/inline code, links, code fences, and
 * horizontal rules. No HTML pass-through (anti-XSS), no tables, no
 * footnotes — those should be added with a real lib (react-markdown
 * + remark-gfm) the day a kb_articles row needs them. Until then,
 * zero dep.
 */
type Block =
  | { kind: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "code"; lang: string | null; body: string }
  | { kind: "hr" };

function tokenize(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (/^---+\s*$/.test(line)) {
      out.push({ kind: "hr" });
      i++;
      continue;
    }
    const fence = /^```(\w+)?\s*$/.exec(line);
    if (fence) {
      const lang = fence[1] ?? null;
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i]!)) {
        body.push(lines[i]!);
        i++;
      }
      i++; // skip closing fence
      out.push({ kind: "code", lang, body: body.join("\n") });
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      out.push({ kind: "heading", level: heading[1]!.length as 1, text: heading[2]!.trim() });
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      out.push({ kind: "ul", items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i]!)) {
        items.push(lines[i]!.replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      out.push({ kind: "ol", items });
      continue;
    }
    // paragraph — accumulate until blank line / structural token
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i]!.trim() !== "" && !/^(#{1,6}\s|[-*]\s|\d+\.\s|---|```)/.test(lines[i]!)) {
      para.push(lines[i]!);
      i++;
    }
    out.push({ kind: "paragraph", text: para.join(" ") });
  }
  return out;
}

/**
 * Inline parser. Handles **bold**, *italic* / _italic_, `code`, [text](url).
 * URLs must be http(s) or relative; everything else is dropped to a plain text
 * span (anti-javascript: scheme).
 */
function renderInline(src: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (m.index > cursor) out.push(src.slice(cursor, m.index));
    const tok = m[0];
    const k = `${keyPrefix}-${key++}`;
    if (tok.startsWith("**")) {
      out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      out.push(
        <code key={k} className="rounded bg-[var(--p-surface-2)] px-1 py-0.5 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("[")) {
      const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      if (link) {
        const url = link[2]!.trim();
        const safe = /^(https?:|\/)/i.test(url) ? url : "#";
        out.push(
          <a
            key={k}
            href={safe}
            target={safe.startsWith("http") ? "_blank" : undefined}
            rel={safe.startsWith("http") ? "noopener noreferrer" : undefined}
            className="text-[var(--p-accent)] underline-offset-2 hover:underline"
          >
            {link[1]}
          </a>,
        );
      } else {
        out.push(tok);
      }
    } else {
      // *italic* or _italic_
      out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    }
    cursor = m.index + tok.length;
  }
  if (cursor < src.length) out.push(src.slice(cursor));
  return out;
}

export function Markdown({ source, className = "" }: { source: string; className?: string }) {
  const blocks = React.useMemo(() => tokenize(source), [source]);

  const rendered = blocks.map((b, i) => {
    const k = `b-${i}`;
    switch (b.kind) {
      case "hr":
        return <hr key={k} className="my-6 border-[var(--p-border)]" />;
      case "heading": {
        const inner = renderInline(b.text, k);
        const sizeMap: Record<number, string> = {
          1: "mt-8 mb-3 text-2xl font-semibold",
          2: "mt-6 mb-2 text-xl font-semibold",
          3: "mt-5 mb-2 text-base font-semibold",
          4: "mt-4 mb-2 text-sm font-semibold",
          5: "mt-3 mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--p-text-2)]",
          6: "mt-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--p-text-2)]",
        };
        const cls = sizeMap[b.level];
        if (b.level === 1)
          return (
            <h1 key={k} className={cls}>
              {inner}
            </h1>
          );
        if (b.level === 2)
          return (
            <h2 key={k} className={cls}>
              {inner}
            </h2>
          );
        if (b.level === 3)
          return (
            <h3 key={k} className={cls}>
              {inner}
            </h3>
          );
        if (b.level === 4)
          return (
            <h4 key={k} className={cls}>
              {inner}
            </h4>
          );
        if (b.level === 5)
          return (
            <h5 key={k} className={cls}>
              {inner}
            </h5>
          );
        return (
          <h6 key={k} className={cls}>
            {inner}
          </h6>
        );
      }
      case "paragraph":
        return (
          <p key={k} className="my-3 text-sm leading-relaxed text-[var(--p-text-2)]">
            {renderInline(b.text, k)}
          </p>
        );
      case "ul":
        return (
          <ul key={k} className="my-3 ms-5 list-disc space-y-1 text-sm text-[var(--p-text-2)]">
            {b.items.map((it, j) => (
              <li key={`${k}-${j}`}>{renderInline(it, `${k}-${j}`)}</li>
            ))}
          </ul>
        );
      case "ol":
        return (
          <ol key={k} className="my-3 ms-5 list-decimal space-y-1 text-sm text-[var(--p-text-2)]">
            {b.items.map((it, j) => (
              <li key={`${k}-${j}`}>{renderInline(it, `${k}-${j}`)}</li>
            ))}
          </ol>
        );
      case "code":
        return (
          <pre
            key={k}
            className="my-4 overflow-x-auto rounded bg-[var(--p-surface-2)] p-3 font-mono text-xs"
            data-lang={b.lang ?? undefined}
          >
            <code>{b.body}</code>
          </pre>
        );
    }
  });

  return <div className={className}>{rendered}</div>;
}
