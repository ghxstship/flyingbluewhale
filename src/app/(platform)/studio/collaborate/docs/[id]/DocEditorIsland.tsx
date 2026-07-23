"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { DOC_STATES, DOC_STATE_LABEL, type DocState, type TiptapDoc } from "@/lib/collaborate";
import { saveDoc, type State } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
// Tiptap is browser-only (ProseMirror touches window/document at module
// eval). Load it via next/dynamic with ssr:false inside this client island
// so the prod Turbopack build never evaluates it during SSR.
const TiptapEditor = dynamic(() => import("./TiptapEditor"), {
  ssr: false,
  loading: () => <div className="skeleton h-96 w-full rounded-md" aria-hidden />,
});

export function DocEditorIsland({
  id,
  initialTitle,
  initialState,
  initialContent,
}: {
  id: string;
  initialTitle: string;
  initialState: DocState;
  initialContent: TiptapDoc;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [docState, setDocState] = useState<DocState>(initialState);
  // Held in a ref so editor keystrokes don't re-render the whole island.
  const contentRef = useRef<TiptapDoc>(initialContent);
  const [result, setResult] = useState<State>(null);
  const resolveErr = useActionErrorResolver();
  const [pending, startTransition] = useTransition();

  const onChange = useCallback((doc: TiptapDoc) => {
    contentRef.current = doc;
  }, []);

  function save() {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("title", title);
    fd.set("doc_state", docState);
    fd.set("content", JSON.stringify(contentRef.current));
    startTransition(async () => {
      const r = await saveDoc(null, fd);
      setResult(r);
    });
  }

  return (
    <div className="space-y-4">
      <div className="surface flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1 min-w-[16rem]">
          <Input
            label="Title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>
        <div>
          <label htmlFor="doc-state" className="text-xs font-medium text-[var(--p-text-2)]">
            State
          </label>
          <select
            id="doc-state"
            className="ps-input mt-1.5 w-full"
            value={docState}
            onChange={(e) => setDocState(e.target.value as DocState)}
          >
            {DOC_STATES.map((s) => (
              <option key={s} value={s}>
                {DOC_STATE_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" loading={pending} onClick={save}>
          {pending ? "Saving" : "Save"}
        </Button>
      </div>

      {result?.error && <Alert kind="error">{resolveErr(result.error)}</Alert>}
      {result?.ok && <Alert kind="success">Saved</Alert>}

      <TiptapEditor initialContent={initialContent} onChange={onChange} />
    </div>
  );
}
