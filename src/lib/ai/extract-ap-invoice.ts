import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { log } from "@/lib/log";

/**
 * AP invoice OCR via Anthropic Vision (gap F38 / G-029 runtime).
 *
 * Sends a base64-encoded PDF to Claude Sonnet 4.6 with a strict JSON-only
 * response shape. Vendor / invoice / line-item fields come back, plus a
 * confidence score that the UI surfaces for human review.
 *
 * Pattern mirrors extract-credential.ts. Sonnet 4.6 supports document
 * (PDF) input directly via the document content block.
 */

const SYSTEM_PROMPT = `You extract structured fields from an AP (accounts-payable) invoice.
Respond with ONLY a JSON object matching this exact shape, no prose:
{
  "vendor_name": "string or null",
  "vendor_tax_id": "string or null (EIN, SSN, or VAT)",
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "total_amount_cents": integer-or-null (in cents),
  "tax_amount_cents": integer-or-null,
  "currency": "USD" or 3-letter ISO code,
  "po_number": "string or null (purchase-order reference)",
  "line_items": [
    {"description": "...", "quantity": number, "unit_price_cents": integer, "total_cents": integer}
  ],
  "_confidence": 0.0-1.0
}
Rules:
- Money: convert dollars/cents to integer cents. $1,234.56 → 123456.
- Dates: ISO 8601 only. Skip if not clearly stated.
- Use null for any field not clearly present on the invoice.
- _confidence: 1.0 = certain, 0.5 = some fields uncertain, 0.0 = could not read.`;

export type ApInvoiceExtraction = {
  vendor_name: string | null;
  vendor_tax_id: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  total_amount_cents: number | null;
  tax_amount_cents: number | null;
  currency: string;
  po_number: string | null;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price_cents: number;
    total_cents: number;
  }>;
  confidence: number;
  model_version: string;
  raw: Record<string, unknown>;
};

export async function extractApInvoice(pdfBytes: Uint8Array): Promise<ApInvoiceExtraction | { error: string }> {
  if (!env.ANTHROPIC_API_KEY) {
    return { error: "ANTHROPIC_API_KEY not configured" };
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const base64 = Buffer.from(pdfBytes).toString("base64");
  const modelVersion = "claude-sonnet-4-6";

  try {
    const res = await client.messages.create({
      model: modelVersion,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: "Extract fields per the system instructions. Return only the JSON object.",
            },
          ],
        },
      ],
    });

    const text = res.content
      .filter((c): c is Extract<typeof c, { type: "text" }> => c.type === "text")
      .map((c) => c.text)
      .join("");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      log.warn("ap_extract.no_json", { sample: text.slice(0, 200) });
      return { error: "Model did not return JSON" };
    }

    const parsed = JSON.parse(match[0]) as Record<string, unknown>;

    const lineItemsRaw = Array.isArray(parsed.line_items) ? (parsed.line_items as unknown[]) : [];
    const line_items = lineItemsRaw
      .filter((l): l is Record<string, unknown> => l != null && typeof l === "object")
      .map((l) => ({
        description: typeof l.description === "string" ? l.description : "",
        quantity: typeof l.quantity === "number" ? l.quantity : 0,
        unit_price_cents: typeof l.unit_price_cents === "number" ? l.unit_price_cents : 0,
        total_cents: typeof l.total_cents === "number" ? l.total_cents : 0,
      }));

    return {
      vendor_name: (parsed.vendor_name as string | null) ?? null,
      vendor_tax_id: (parsed.vendor_tax_id as string | null) ?? null,
      invoice_number: (parsed.invoice_number as string | null) ?? null,
      invoice_date: (parsed.invoice_date as string | null) ?? null,
      due_date: (parsed.due_date as string | null) ?? null,
      total_amount_cents: (parsed.total_amount_cents as number | null) ?? null,
      tax_amount_cents: (parsed.tax_amount_cents as number | null) ?? null,
      currency: typeof parsed.currency === "string" ? parsed.currency : "USD",
      po_number: (parsed.po_number as string | null) ?? null,
      line_items,
      confidence: typeof parsed._confidence === "number" ? Math.max(0, Math.min(1, parsed._confidence)) : 0.5,
      model_version: modelVersion,
      raw: parsed,
    };
  } catch (e) {
    log.error("ap_extract.exception", { err: e instanceof Error ? e.message : String(e) });
    return { error: e instanceof Error ? e.message : "Extraction failed" };
  }
}
