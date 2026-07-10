"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { sanitizeHtml } from "@/lib/sanitize";
import { useT, useFormatters } from "@/lib/i18n/LocaleProvider";

/**
 * Email-template editor with merge-tag autocomplete.
 *
 * - Type `{{` in the subject or body to open a fuzzy autocomplete of the
 *   known merge tags.
 * - Click a row to edit in place; PATCH persists inline.
 * - Live preview renders the rendered HTML with sample values filled in.
 */

type Template = {
  id: string;
  slug: string;
  name: string;
  subject: string;
  body_html?: string;
  body_text?: string | null;
  merge_tags?: string[];
  is_active: boolean;
  updated_at: string;
};

const MERGE_TAGS: Array<{ tag: string; sample: string; description: string }> = [
  { tag: "org_name", sample: "Acme Productions", description: "Your org's display name" },
  { tag: "client_name", sample: "Jane Doe", description: "Recipient's first name" },
  { tag: "client_email", sample: "jane@client.com", description: "Recipient's email" },
  { tag: "project_name", sample: "MMW26 Hialeah", description: "Project title" },
  { tag: "event_date", sample: "Aug 14, 2026", description: "Event start date" },
  { tag: "invoice_number", sample: "INV-26-00042", description: "Invoice number" },
  { tag: "invoice_total", sample: "$12,450.00", description: "Formatted invoice total" },
  { tag: "proposal_number", sample: "PROP-26-00009", description: "Proposal number" },
  { tag: "portal_url", sample: "https://gvteway.atlvs.pro/acme-26-tour", description: "Signed portal URL" },
  { tag: "sender_name", sample: "Alex Chen", description: "User sending the email" },
  { tag: "today", sample: "Apr 19, 2026", description: "Today's formatted date" },
];

function renderPreview(body: string): string {
  let out = body;
  for (const { tag, sample } of MERGE_TAGS) {
    out = out.replace(new RegExp(`{{\\s*${tag}\\s*}}`, "g"), sample);
  }
  return out;
}

export function EmailTemplatesPanel({ initial }: { initial: Template[] }) {
  const t = useT();
  const fmt = useFormatters();
  const [templates, setTemplates] = useState<Template[]>(initial);
  const [mode, setMode] = useState<"list" | "new" | { edit: string }>("list");
  const [form, setForm] = useState<Partial<Template>>({
    slug: "",
    name: "",
    subject: "",
    body_html: "",
  });
  const [isPending, startTransition] = useTransition();

  const active = typeof mode === "object" && "edit" in mode ? mode.edit : null;

  useEffect(() => {
    if (mode === "new") {
      setForm({ slug: "", name: "", subject: "", body_html: "", body_text: "" });
    } else if (active) {
      const tpl = templates.find((x) => x.id === active);
      if (tpl) setForm({ ...tpl });
    }
  }, [mode, active, templates]);

  const save = useCallback(() => {
    if (mode === "new") {
      if (!form.slug || !form.name || !form.subject || !form.body_html) {
        toast.error(
          t("console.settings.emailTemplates.requiredToast", undefined, "Slug, name, subject, and body are required"),
        );
        return;
      }
      startTransition(async () => {
        const r = await fetch("/api/v1/email-templates", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            slug: form.slug,
            name: form.name,
            subject: form.subject,
            bodyHtml: form.body_html,
            bodyText: form.body_text || undefined,
          }),
        });
        const body = await r.json().catch(() => ({}));
        if (!r.ok || body.ok === false) {
          toast.error(
            body.error?.message ?? t("console.settings.emailTemplates.createFailedToast", undefined, "Create failed"),
          );
          return;
        }
        if (body.data?.template) {
          setTemplates((ts) => [body.data.template, ...ts]);
          setMode("list");
          toast.success(t("console.settings.emailTemplates.createdToast", undefined, "Template created"));
        }
      });
    } else if (active) {
      startTransition(async () => {
        const r = await fetch(`/api/v1/email-templates/${active}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            subject: form.subject,
            bodyHtml: form.body_html,
            bodyText: form.body_text,
            isActive: form.is_active,
          }),
        });
        const body = await r.json().catch(() => ({}));
        if (!r.ok || body.ok === false) {
          toast.error(
            body.error?.message ?? t("console.settings.emailTemplates.saveFailedToast", undefined, "Save failed"),
          );
          return;
        }
        if (body.data?.template) {
          setTemplates((ts) => ts.map((tpl) => (tpl.id === active ? body.data.template : tpl)));
          setMode("list");
          toast.success(t("console.settings.emailTemplates.savedToast", undefined, "Template saved"));
        }
      });
    }
  }, [mode, form, active, t]);

  if (mode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--p-text-2)]">
            {templates.length === 1
              ? t(
                  "console.settings.emailTemplates.countOne",
                  { count: templates.length },
                  `${templates.length} template`,
                )
              : t(
                  "console.settings.emailTemplates.countOther",
                  { count: templates.length },
                  `${templates.length} templates`,
                )}
          </p>
          <Button type="button" onClick={() => setMode("new")}>
            {t("console.settings.emailTemplates.newTemplate", undefined, "New Template")}
          </Button>
        </div>
        {templates.length === 0 ? (
          <EmptyState
            title={t("console.settings.emailTemplates.emptyTitle", undefined, "No Templates Yet")}
            description={t(
              "console.settings.emailTemplates.emptyDescription",
              undefined,
              "Transactional email shapes for proposals, invoices, and notifications.",
            )}
            action={
              <Button type="button" onClick={() => setMode("new")}>
                {t("console.settings.emailTemplates.newTemplate", undefined, "New Template")}
              </Button>
            }
          />
        ) : (
          <table className="ps-table w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.settings.emailTemplates.colSlug", undefined, "Slug")}</th>
                <th>{t("console.settings.emailTemplates.colName", undefined, "Name")}</th>
                <th>{t("console.settings.emailTemplates.colSubject", undefined, "Subject")}</th>
                <th>{t("console.settings.emailTemplates.colActive", undefined, "Active")}</th>
                <th>{t("console.settings.emailTemplates.colUpdated", undefined, "Updated")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <tr key={tpl.id}>
                  <td className="font-mono text-xs">{tpl.slug}</td>
                  <td>{tpl.name}</td>
                  <td className="text-[var(--p-text-2)]">{tpl.subject}</td>
                  <td>{tpl.is_active ? t("common.yes", undefined, "Yes") : t("common.no", undefined, "No")}</td>
                  <td className="font-mono text-xs">{fmt.date(new Date(tpl.updated_at))}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setMode({ edit: tpl.id })}
                      className="text-xs text-[var(--p-accent)] hover:underline"
                    >
                      {t("common.edit", undefined, "Edit")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <div className="surface space-y-3 p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">
          {mode === "new"
            ? t("console.settings.emailTemplates.newTemplate", undefined, "New Template")
            : t("console.settings.emailTemplates.editTemplate", undefined, "Edit template")}
        </div>
        <button
          type="button"
          onClick={() => setMode("list")}
          className="text-xs text-[var(--p-text-2)] hover:underline"
        >
          {t("common.cancel", undefined, "Cancel")}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={t("console.settings.emailTemplates.colSlug", undefined, "Slug")}
          value={form.slug ?? ""}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          placeholder="proposal.share"
          disabled={mode !== "new"}
        />
        <Input
          label={t("console.settings.emailTemplates.colName", undefined, "Name")}
          value={form.name ?? ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t("console.settings.emailTemplates.namePlaceholder", undefined, "Proposal share")}
        />
      </div>

      <MergeTagField
        label={t("console.settings.emailTemplates.colSubject", undefined, "Subject")}
        value={form.subject ?? ""}
        onChange={(v) => setForm({ ...form, subject: v })}
        singleLine
      />

      <MergeTagField
        label={t("console.settings.emailTemplates.bodyHtml", undefined, "Body HTML")}
        value={form.body_html ?? ""}
        onChange={(v) => setForm({ ...form, body_html: v })}
      />

      {mode !== "new" && (
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={form.is_active ?? true}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          <span>{t("console.settings.emailTemplates.colActive", undefined, "Active")}</span>
        </label>
      )}

      <div className="mt-4 grid gap-3 rounded-md border border-[var(--p-border)] bg-[var(--p-surface-2)] p-3 text-xs">
        <div className="font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("console.settings.emailTemplates.preview", undefined, "Preview")}
        </div>
        <div>
          <div className="text-[11px] text-[var(--p-text-2)]">
            {t("console.settings.emailTemplates.colSubject", undefined, "Subject")}
          </div>
          <div className="mt-0.5 text-[var(--p-text-1)]">{renderPreview(form.subject ?? "")}</div>
        </div>
        <div>
          <div className="text-[11px] text-[var(--p-text-2)]">
            {t("console.settings.emailTemplates.body", undefined, "Body")}
          </div>
          <div
            className="prose prose-sm mt-1 max-w-none rounded bg-[var(--white)] p-3 text-[var(--text-inverted)]"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderPreview(form.body_html ?? "")) }}
          />
        </div>
      </div>

      <MergeTagCatalog />

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={save} disabled={isPending}>
          {isPending
            ? t("common.saving", undefined, "Saving…")
            : t("console.settings.emailTemplates.saveTemplate", undefined, "Save template")}
        </Button>
      </div>
    </div>
  );
}

function MergeTagCatalog() {
  const t = useT();
  return (
    <details className="rounded-md border border-[var(--p-border)] bg-[var(--p-surface-2)] text-xs">
      <summary className="cursor-pointer px-3 py-2 font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
        {t(
          "console.settings.emailTemplates.availableMergeTags",
          { count: MERGE_TAGS.length },
          `Available merge tags (${MERGE_TAGS.length})`,
        )}
      </summary>
      <div className="max-h-56 overflow-y-auto px-3 py-2">
        <ul className="divide-y divide-[var(--p-border)]">
          {MERGE_TAGS.map((m) => (
            <li key={m.tag} className="flex items-center justify-between gap-3 py-1.5">
              <code className="font-mono text-[11px] text-[var(--p-accent)]">{`{{${m.tag}}}`}</code>
              <span className="flex-1 text-[var(--p-text-2)]">
                {t(`console.settings.emailTemplates.mergeTag.${m.tag}.description`, undefined, m.description)}
              </span>
              <span className="text-[var(--p-text-2)]">{m.sample}</span>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

/**
 * Textfield with inline autocomplete. When the caret sits just after a
 * `{{` token, a dropdown appears listing matching tags. Picking one
 * replaces the partial with the full `{{tag}}`.
 */
function MergeTagField({
  label,
  value,
  onChange,
  singleLine = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  singleLine?: boolean;
}) {
  const t = useT();
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tokenStart, setTokenStart] = useState<number | null>(null);

  function onChangeRaw(raw: string, caret: number) {
    onChange(raw);
    // Look backwards from caret for `{{` with no close since
    const before = raw.slice(0, caret);
    const match = before.match(/\{\{\s*([\w.]*)$/);
    if (match) {
      setOpen(true);
      setQuery(match[1] ?? "");
      setTokenStart(before.length - match[0].length);
    } else {
      setOpen(false);
    }
  }

  function pick(tag: string) {
    if (tokenStart == null || !ref.current) return;
    const before = value.slice(0, tokenStart);
    const caret = ref.current.selectionStart ?? value.length;
    const after = value.slice(caret);
    const insert = `{{${tag}}}`;
    const next = before + insert + after;
    onChange(next);
    setOpen(false);
    setTimeout(() => {
      const pos = before.length + insert.length;
      ref.current?.setSelectionRange(pos, pos);
      ref.current?.focus();
    }, 0);
  }

  const candidates = MERGE_TAGS.filter((m) => m.tag.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  const FieldTag = singleLine ? "input" : "textarea";

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-[var(--p-text-2)]">{label}</label>
      <FieldTag
        ref={ref as never}
        value={value}
        rows={singleLine ? undefined : 10}
        onChange={(e) =>
          onChangeRaw(e.target.value, (e.target as HTMLInputElement).selectionStart ?? e.target.value.length)
        }
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className={`ps-input mt-1 w-full ${singleLine ? "" : "font-mono text-xs"}`}
      />
      {open && candidates.length > 0 && (
        <div className="absolute start-0 end-0 z-20 mt-1 overflow-hidden rounded-md border border-[var(--p-border)] bg-[var(--p-surface)]">
          {candidates.map((m) => (
            <button
              key={m.tag}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(m.tag);
              }}
              className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-start text-xs hover:bg-[var(--p-surface-2)]"
            >
              <code className="font-mono text-[var(--p-accent)]">{`{{${m.tag}}}`}</code>
              <span className="truncate text-[var(--p-text-2)]">
                {t(`console.settings.emailTemplates.mergeTag.${m.tag}.description`, undefined, m.description)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
