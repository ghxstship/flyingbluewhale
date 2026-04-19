"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Template = {
  id: string;
  slug: string;
  name: string;
  subject: string;
  is_active: boolean;
  updated_at: string;
};

export function EmailTemplatesPanel({ initial }: { initial: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(initial);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ slug: "", name: "", subject: "", bodyHtml: "" });
  const [isPending, startTransition] = useTransition();

  function create() {
    if (!form.slug || !form.name || !form.subject || !form.bodyHtml) {
      toast.error("All fields required");
      return;
    }
    startTransition(async () => {
      const r = await fetch("/api/v1/email-templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await r.json().catch(() => ({}))) as { ok?: boolean; data?: { template: Template }; error?: { message?: string } };
      if (!r.ok || body.ok === false) {
        toast.error(body.error?.message ?? "Create failed");
        return;
      }
      if (body.data?.template) {
        setTemplates((ts) => [body.data!.template, ...ts]);
        setCreating(false);
        setForm({ slug: "", name: "", subject: "", bodyHtml: "" });
        toast.success("Template created");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{templates.length} template{templates.length === 1 ? "" : "s"}</p>
        <Button type="button" onClick={() => setCreating((v) => !v)}>{creating ? "Cancel" : "New template"}</Button>
      </div>
      {creating ? (
        <div className="surface-raised p-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="proposal.share" />
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Proposal share" />
          </div>
          <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="{{org_name}} sent you a proposal" />
          <label className="block text-xs">
            <span className="font-medium uppercase tracking-wider text-[var(--text-muted)]">Body HTML</span>
            <textarea
              rows={8}
              value={form.bodyHtml}
              onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
              className="input-base mt-1 w-full font-mono text-xs"
              placeholder="<p>Hi {{client_name}} …</p>"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={create} disabled={isPending}>{isPending ? "Saving…" : "Save template"}</Button>
          </div>
        </div>
      ) : null}
      {templates.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No templates yet.</p>
      ) : (
        <table className="data-table w-full text-sm">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Name</th>
              <th>Subject</th>
              <th>Active</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <td className="font-mono text-xs">{t.slug}</td>
                <td>{t.name}</td>
                <td className="text-[var(--text-muted)]">{t.subject}</td>
                <td>{t.is_active ? "Yes" : "No"}</td>
                <td className="font-mono text-xs">{new Date(t.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
