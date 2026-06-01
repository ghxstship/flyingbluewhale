"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { STATUS_TONE } from "@/lib/marketplace";

type ContractRow = {
  id: string;
  rendered_markdown: string;
  status: string;
  sent_at: string | null;
  signed_by_org_at: string | null;
  signed_by_talent_at: string | null;
} | null;

export function ContractView({
  offerId,
  contract: initialContract,
  templates,
}: {
  offerId: string;
  contract: ContractRow;
  templates: Array<{ id: string; name: string; is_default: boolean }>;
}) {
  const [contract, setContract] = useState(initialContract);
  const [selectedTemplate, setSelectedTemplate] = useState(templates.find((t) => t.is_default)?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [generating, startGenerate] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draftMarkdown, setDraftMarkdown] = useState(contract?.rendered_markdown ?? "");

  function generate() {
    setError(null);
    startGenerate(async () => {
      const res = await fetch(`/api/v1/marketplace/offers/${offerId}/contract`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ template_id: selectedTemplate || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message ?? "Failed to generate"); return; }
      setContract(json.data.contract);
      setDraftMarkdown(json.data.contract.rendered_markdown);
    });
  }

  if (!contract) {
    return (
      <div className="surface space-y-4 p-6">
        <h2 className="text-sm font-semibold">No contract yet</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Generate a contract from a template. You can edit the rendered text before sending.
        </p>
        {templates.length > 0 && (
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Template</label>
            <select
              className="input-base mt-1.5 w-full"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">No template (blank)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_default ? "(default)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        {templates.length === 0 && (
          <p className="text-xs text-[var(--text-muted)]">
            No templates yet.{" "}
            <a href="/console/settings/contracts" className="underline">
              Create one in Settings
            </a>
            .
          </p>
        )}
        {error && <Alert kind="error">{error}</Alert>}
        <Button onClick={generate} disabled={generating}>
          {generating ? "Generating…" : "Generate Contract"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="surface flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Contract</span>
          <Badge tone={STATUS_TONE[contract.status] ?? "default"}>{contract.status}</Badge>
        </div>
        <div className="flex gap-2">
          {contract.status === "draft" && (
            <>
              <Button variant="ghost" onClick={() => { setEditing(!editing); setDraftMarkdown(contract.rendered_markdown); }}>
                {editing ? "Cancel edit" : "Edit"}
              </Button>
              <Button variant="secondary" onClick={generate} disabled={generating}>
                {generating ? "Regenerating…" : "Regenerate"}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && <Alert kind="error">{error}</Alert>}

      {editing ? (
        <div className="surface space-y-3 p-4">
          <textarea
            className="input-base w-full font-mono text-xs"
            rows={30}
            value={draftMarkdown}
            onChange={(e) => setDraftMarkdown(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                setContract((c) => c ? { ...c, rendered_markdown: draftMarkdown } : c);
                setEditing(false);
              }}
            >
              Save edits
            </Button>
          </div>
        </div>
      ) : (
        <div className="surface p-6">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
            {contract.rendered_markdown}
          </pre>
        </div>
      )}

      {contract.signed_by_org_at && (
        <p className="text-xs text-[var(--text-muted)]">
          Signed by org: {new Date(contract.signed_by_org_at).toLocaleDateString()}
        </p>
      )}
      {contract.signed_by_talent_at && (
        <p className="text-xs text-[var(--text-muted)]">
          Countersigned by talent: {new Date(contract.signed_by_talent_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
