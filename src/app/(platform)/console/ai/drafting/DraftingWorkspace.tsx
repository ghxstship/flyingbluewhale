"use client";

import { useState } from "react";
import { Sparkles, Copy, Download, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type TemplateKey = "proposal" | "sop" | "contract" | "press_release" | "call_sheet" | "email";

type Template = {
  key: TemplateKey;
  label: string;
  description: string;
  fields: { name: string; label: string; placeholder: string; multiline?: boolean }[];
  systemPrompt: (fields: Record<string, string>) => string;
};

const TEMPLATES: Template[] = [
  {
    key: "proposal",
    label: "Proposal",
    description: "Client-facing production proposal with scope, deliverables, and pricing.",
    fields: [
      { name: "client", label: "Client name", placeholder: "Acme Corp" },
      { name: "event", label: "Event / project", placeholder: "Annual summit, Dallas TX, Jun 2026" },
      { name: "scope", label: "Scope of work", placeholder: "Full AV production, stage design, live streaming…", multiline: true },
      { name: "budget", label: "Budget range", placeholder: "$45,000 – $60,000" },
      { name: "tone", label: "Tone", placeholder: "Confident, luxury" },
    ],
    systemPrompt: (f) =>
      `You are a senior production manager writing a client proposal for ${f.client || "a client"} for ${f.event || "an upcoming event"}. Scope: ${f.scope || "full production"}. Budget: ${f.budget || "TBD"}. Tone: ${f.tone || "professional"}. Write a compelling proposal with: Executive Summary, Scope of Work, Key Deliverables, Timeline, Investment, and Why LYTEHAUS. Use plain Markdown. Be specific, confident, luxury-grade but not verbose.`,
  },
  {
    key: "sop",
    label: "SOP",
    description: "Standard operating procedure for a crew role or operational process.",
    fields: [
      { name: "role", label: "Role / department", placeholder: "Stage Manager, Lighting Dept." },
      { name: "process", label: "Process name", placeholder: "Load-in sequence for festival stages" },
      { name: "context", label: "Context / constraints", placeholder: "3 stages, 8-hour window, union crew", multiline: true },
    ],
    systemPrompt: (f) =>
      `Write a clear, actionable SOP for ${f.role || "crew"} covering: ${f.process || "the described process"}. Context: ${f.context || ""}. Use numbered steps, include safety callouts, and flag decision points. Markdown format.`,
  },
  {
    key: "contract",
    label: "Contract Summary",
    description: "Plain-language contract summary and key terms for a booking.",
    fields: [
      { name: "parties", label: "Parties", placeholder: "LYTEHAUS Technologies & DJ Name / Agency" },
      { name: "event", label: "Event details", placeholder: "Festival, date, venue, set time" },
      { name: "fee", label: "Fee & payment terms", placeholder: "$5,000 — 60% deposit, 40% on load-in" },
      { name: "rider", label: "Key rider items", placeholder: "Hospitality, backline, travel", multiline: true },
    ],
    systemPrompt: (f) =>
      `Draft a concise contract summary for: Parties: ${f.parties || ""}. Event: ${f.event || ""}. Fee: ${f.fee || ""}. Rider: ${f.rider || ""}. Include: Engagement Summary, Payment Schedule, Cancellation Policy, Rider Highlights, and Governing Terms. Plain Markdown.`,
  },
  {
    key: "press_release",
    label: "Press Release",
    description: "Announcement press release for an event, hire, or partnership.",
    fields: [
      { name: "headline", label: "Headline", placeholder: "LYTEHAUS Technologies Tapped for…" },
      { name: "news", label: "What's the news", placeholder: "New partnership with XYZ Festival…", multiline: true },
      { name: "quote_name", label: "Quote attribution", placeholder: "CEO / Founder name" },
      { name: "date_city", label: "Dateline", placeholder: "Miami, FL — May 12, 2026" },
    ],
    systemPrompt: (f) =>
      `Write an AP-style press release. Dateline: ${f.date_city || ""}. Headline: ${f.headline || ""}. News: ${f.news || ""}. Include a quote attributed to ${f.quote_name || "a spokesperson"}. Boilerplate for LYTEHAUS Technologies at the end. Markdown.`,
  },
  {
    key: "call_sheet",
    label: "Call Sheet Draft",
    description: "Pre-production call sheet outline for a show or event day.",
    fields: [
      { name: "event", label: "Event", placeholder: "Music festival main stage — Day 2" },
      { name: "date_venue", label: "Date & venue", placeholder: "Sat Jun 14, 2026 — Bayfront Park, Miami" },
      { name: "schedule", label: "Key times", placeholder: "06:00 Load-in / 12:00 Sound check / 18:00 Doors / 20:00 HS", multiline: true },
      { name: "departments", label: "Departments", placeholder: "Production, Audio, Lighting, Video, Catering" },
    ],
    systemPrompt: (f) =>
      `Draft a structured call sheet for: ${f.event || "an event"}. Date/venue: ${f.date_venue || ""}. Schedule: ${f.schedule || ""}. Departments: ${f.departments || ""}. Format with: General Info, Key Contacts placeholder, Schedule table, Department call times, and On-Site Notes section. Markdown tables where helpful.`,
  },
  {
    key: "email",
    label: "Email Draft",
    description: "Professional email for client outreach, follow-up, or crew comms.",
    fields: [
      { name: "recipient", label: "Recipient / context", placeholder: "Festival promoter, first follow-up" },
      { name: "subject", label: "Subject", placeholder: "Re: Production quote for Summer Fest 2026" },
      { name: "intent", label: "Intent / key points", placeholder: "Follow up on proposal, offer a call, answer pricing question", multiline: true },
      { name: "tone", label: "Tone", placeholder: "Confident, warm, concise" },
    ],
    systemPrompt: (f) =>
      `Write a professional email to: ${f.recipient || "a client"}. Subject: ${f.subject || ""}. Intent: ${f.intent || ""}. Tone: ${f.tone || "professional"}. Sign off from LYTEHAUS Technologies. Output: Subject line + body only. No preamble.`,
  },
];

export function DraftingWorkspace() {
  const [selected, setSelected] = useState<TemplateKey>("proposal");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFields, setShowFields] = useState(true);

  const template = TEMPLATES.find((t) => t.key === selected)!;

  function setField(name: string, value: string) {
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  async function generate() {
    setError(null);
    setOutput("");
    setStreaming(true);
    setShowFields(false);

    try {
      const prompt = template.systemPrompt(fields);
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";
        for (const block of blocks) {
          const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
          const eventLine = block.split("\n").find((l) => l.startsWith("event:"));
          if (!dataLine || !eventLine) continue;
          const event = eventLine.slice(6).trim();
          if (event === "delta") {
            try {
              const data = JSON.parse(dataLine.slice(5).trim());
              if (data.text) {
                text += data.text;
                setOutput(text);
              }
            } catch {
              /* skip */
            }
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setStreaming(false);
    }
  }

  function reset() {
    setOutput("");
    setError(null);
    setShowFields(true);
  }

  function downloadMd() {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.key}-draft.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-content space-y-4">
      {/* Template selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {TEMPLATES.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setSelected(t.key);
              reset();
            }}
            className={`surface rounded-lg p-3 text-left transition-all ${
              selected === t.key
                ? "ring-2 ring-[var(--org-primary)]"
                : "hover:ring-1 hover:ring-[var(--border)]"
            }`}
          >
            <div className="text-xs font-semibold">{t.label}</div>
            <div className="mt-0.5 text-[10px] text-[var(--text-muted)] leading-snug line-clamp-2">
              {t.description}
            </div>
          </button>
        ))}
      </div>

      {/* Context fields (collapsible after generation) */}
      <div className="surface">
        <button
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          onClick={() => setShowFields((v) => !v)}
        >
          <span>Context — {template.label}</span>
          {showFields ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showFields && (
          <div className="border-t border-[var(--border)] p-4 space-y-3">
            {template.fields.map((f) =>
              f.multiline ? (
                <div key={f.name}>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                    {f.label}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={f.placeholder}
                    value={fields[f.name] ?? ""}
                    onChange={(e) => setField(f.name, e.target.value)}
                    className="input-base w-full resize-none text-sm"
                  />
                </div>
              ) : (
                <Input
                  key={f.name}
                  label={f.label}
                  placeholder={f.placeholder}
                  value={fields[f.name] ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                />
              ),
            )}
            <Button onClick={generate} disabled={streaming} size="sm">
              <Sparkles size={13} className="mr-1.5" />
              {streaming ? "Generating…" : "Generate draft"}
            </Button>
          </div>
        )}
      </div>

      {/* Output */}
      {(output || error) && (
        <div className="surface">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {streaming ? "Generating…" : "Draft output"}
            </span>
            {!streaming && output && (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(output)}>
                  <Copy size={12} className="mr-1" /> Copy
                </Button>
                <Button size="sm" variant="ghost" onClick={downloadMd}>
                  <Download size={12} className="mr-1" /> .md
                </Button>
                <Button size="sm" variant="ghost" onClick={reset}>
                  <RotateCcw size={12} className="mr-1" /> Reset
                </Button>
              </div>
            )}
          </div>
          {error ? (
            <div className="p-4 text-sm text-[var(--danger)]">{error}</div>
          ) : (
            <pre className="p-4 text-sm whitespace-pre-wrap font-sans leading-relaxed text-[var(--text-primary)] max-h-[600px] overflow-y-auto">
              {output}
              {streaming && <span className="animate-pulse">▌</span>}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
