"use client";

import * as React from "react";
import { Markdown } from "@/components/Markdown";
import type { MarkdownWidget as MarkdownWidgetConfig } from "@/lib/dashboards/types";

/**
 * MarkdownWidget — renders the widget config's `content` via the in-house
 * `<Markdown>` renderer (no HTML pass-through, no remote includes).
 */
export function MarkdownWidget({ widget }: { widget: MarkdownWidgetConfig }): React.ReactElement {
  return (
    <div className="surface flex h-full flex-col overflow-auto p-4">
      {widget.title && (
        <h3 className="mb-2 text-sm font-semibold tracking-tight text-[var(--p-text-1)]">{widget.title}</h3>
      )}
      <Markdown source={widget.content} className="flex-1" />
    </div>
  );
}
