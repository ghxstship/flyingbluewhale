"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

type ParseResult = {
  title: string;
  description: string;
  estimated_cents: number | null;
  vendor_name: string | null;
  line_items: Array<{ description: string; quantity: number; unit_price_cents: number }>;
};

type Props = {
  onParsed: (result: ParseResult) => void;
};

export function AiParsePanel({ onParsed }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function parse() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/ai/parse-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Parse failed");
        return;
      }
      onParsed(json.data as ParseResult);
      setOpen(false);
      setText("");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--p-accent)] hover:underline"
      >
        {t("console.procurement.requisitions.new.pasteQuote", undefined, "Paste a vendor quote to auto-fill →")}
      </button>
    );
  }

  return (
    <div className="surface-inset rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--p-text-1)]">
          {t("console.procurement.requisitions.new.aiParse.title", undefined, "AI Quote Parser")}
        </p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
          {t("common.cancel", undefined, "Cancel")}
        </button>
      </div>
      <p className="text-xs text-[var(--p-text-2)]">
        {t(
          "console.procurement.requisitions.new.aiParse.hint",
          undefined,
          "Paste a vendor quote (email body, PDF text, or plain list). Claude will extract the title, total, and line items.",
        )}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        maxLength={20_000}
        placeholder={t(
          "console.procurement.requisitions.new.aiParse.placeholder",
          undefined,
          "Paste quote text here…",
        )}
        className="ps-input w-full font-mono text-xs"
      />
      {error && (
        <p className="text-xs text-[var(--c-error)]">{error}</p>
      )}
      <Button type="button" size="sm" onClick={parse} disabled={loading || !text.trim()}>
        {loading
          ? t("console.procurement.requisitions.new.aiParse.parsing", undefined, "Parsing…")
          : t("console.procurement.requisitions.new.aiParse.parse", undefined, "Parse Quote")}
      </Button>
    </div>
  );
}
