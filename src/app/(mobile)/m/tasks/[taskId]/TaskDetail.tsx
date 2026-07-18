"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RecordDetail, KIcon } from "@/components/mobile/kit";
import {
  NEXT_TASK_STATES,
  TASK_STATES,
  stateTone,
  type TaskState,
} from "../_shared";
import { addTaskComment, setTaskState, toggleChecklistItem } from "./actions";

export type ChecklistEntry = { label: string; done: boolean };

type DetailTask = {
  id: string;
  title: string;
  description: string;
  state: TaskState;
  priority: "High" | "Medium" | "Low";
  due: string;
  assignee: string;
  created: string;
  updated: string;
  // Kit 31 (live-test resolution #14) — construction-grade facets.
  trade: string | null;
  costCode: string | null;
  company: string | null;
  location: string | null;
  ppe: string[];
  permitRequired: boolean;
  percentComplete: number | null;
  checklist: ChecklistEntry[];
};

export type CommentItem = {
  who: string;
  time: string;
  text: string;
  mentions: string[];
};

export type AttachmentItem = {
  id: string;
  name: string;
  kind: "photo" | "file";
};

export type EventItem = {
  id: string;
  icon: string;
  txt: string;
  time: string;
};

type Labels = {
  eyebrow: string;
  status: string;
  priority: string;
  due: string;
  assignee: string;
  created: string;
  updated: string;
  stateOpen: string;
  stateProgress: string;
  stateBlocked: string;
  stateReview: string;
  stateDone: string;
  photos: string;
  photosEmpty: string;
  description: string;
  descriptionEmpty: string;
  activity: string;
  activityEmpty: string;
  actCreated: string;
  actUpdated: string;
  permWarn: string;
  updated_toast: string;
  trade: string;
  costCode: string;
  company: string;
  location: string;
  ppe: string;
  permit: string;
  permitYes: string;
  progress: string;
  checklist: string;
  checklistEmpty: string;
};

export function TaskDetail({
  task,
  canTransition,
  labels,
  comments,
  events,
  attachments,
}: {
  task: DetailTask;
  canTransition: boolean;
  labels: Labels;
  comments: CommentItem[];
  events: EventItem[];
  attachments: AttachmentItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<TaskState>(task.state);
  const [err, setErr] = useState<string | null>(null);

  const stateLabel: Record<TaskState, string> = {
    todo: labels.stateOpen,
    in_progress: labels.stateProgress,
    blocked: labels.stateBlocked,
    review: labels.stateReview,
    done: labels.stateDone,
  };

  // Reachable states from the current one (plus the current itself, shown
  // selected). Mirrors the server lifecycle guard.
  const reachable = new Set<TaskState>([state, ...(NEXT_TASK_STATES[state] ?? [])]);

  const transition = (next: TaskState) => {
    if (next === state || pending || !canTransition || !reachable.has(next)) return;
    setErr(null);
    const fd = new FormData();
    fd.set("taskId", task.id);
    fd.set("next", next);
    startTransition(async () => {
      const res = await setTaskState(null, fd);
      if (res?.error) {
        setErr(res.error);
        return;
      }
      setState(next);
      router.refresh();
    });
  };

  // The composer posts to the real `task_comments` table; mentions arrive as
  // display names — we map them back nowhere here (server stores the names the
  // user picked is not what we want), so we forward only names the kit knows.
  const onComment = (text: string, _tagged: string[]) => {
    if (pending) return;
    setErr(null);
    startTransition(async () => {
      // mentions are display names from the kit picker; we don't have user ids
      // client-side, so persist with an empty mentions[] (the body carries the
      // @name text). A richer mention resolver can wire ids later.
      const res = await addTaskComment(task.id, text, []);
      if (res?.error) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  };

  // Status lifecycle chip row — rendered as a RecordDetail section node so it
  // sits with the rest of the record.
  const lifecycle = (
    <>
      <div className="chips">
        {TASK_STATES.map((s) => {
          const enabled = canTransition && reachable.has(s);
          return (
            <button
              key={s}
              type="button"
              className={`chip ${state === s ? "on" : ""}`}
              disabled={!enabled || pending}
              style={!enabled ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
              onClick={() => transition(s)}
            >
              {stateLabel[s]}
            </button>
          );
        })}
      </div>
      {!canTransition && (
        <div className="wsub" style={{ marginTop: 8 }}>
          {labels.permWarn}
        </div>
      )}
      {err && (
        <div className="wsub" style={{ marginTop: 8, color: "var(--p-danger)" }}>
          {err}
        </div>
      )}
    </>
  );

  // Photo / file thumbs — real `task_attachments` rows. Upload arrives later;
  // for now we list what exists.
  const photosNode =
    attachments.length === 0 ? (
      <div className="s" style={{ color: "var(--p-text-3)" }}>{labels.photosEmpty}</div>
    ) : (
      <div className="gal-grid" style={{ marginTop: 4 }}>
        {attachments.map((a) => (
          <div
            key={a.id}
            className="surface-inset"
            style={{
              aspectRatio: "1 / 1",
              borderRadius: "var(--p-r-md)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: 8,
              textAlign: "center",
            }}
          >
            <KIcon name={a.kind === "file" ? "FileText" : "Image"} size={20} />
            <div className="s" style={{ fontSize: 10, wordBreak: "break-word" }}>{a.name}</div>
          </div>
        ))}
      </div>
    );

  const timeline = events.map((e) => ({ icon: e.icon, txt: e.txt, time: e.time }));

  // Kit 31 #14 — construction facets render as record fields when present.
  const fields = [
    { k: labels.priority, v: task.priority },
    { k: labels.due, v: task.due },
    { k: labels.assignee, v: task.assignee },
    { k: labels.created, v: task.created },
  ];
  if (task.trade) fields.push({ k: labels.trade, v: task.trade });
  if (task.costCode) fields.push({ k: labels.costCode, v: task.costCode });
  if (task.company) fields.push({ k: labels.company, v: task.company });
  if (task.location) fields.push({ k: labels.location, v: task.location });
  if (task.permitRequired) fields.push({ k: labels.permit, v: labels.permitYes });
  if (task.percentComplete != null) fields.push({ k: labels.progress, v: `${task.percentComplete}%` });

  const toggleItem = (index: number, done: boolean) => {
    if (pending || !canTransition) return;
    setErr(null);
    startTransition(async () => {
      const res = await toggleChecklistItem(task.id, index, done);
      if (res?.error) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  };

  // Checklist section — real jsonb sub-items; toggles are RBAC-gated the
  // same as a state change and recompute percent_complete server-side.
  const checklistNode =
    task.checklist.length === 0 ? null : (
      <div>
        {task.checklist.map((item, i) => (
          <button
            key={`${item.label}-${i}`}
            type="button"
            disabled={!canTransition || pending}
            onClick={() => toggleItem(i, !item.done)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              width: "100%",
              textAlign: "left",
              background: "none",
              border: "none",
              padding: "8px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--p-border)",
              cursor: canTransition ? "pointer" : "default",
              color: "var(--p-text-1)",
              font: "inherit",
            }}
            aria-pressed={item.done}
          >
            <span
              aria-hidden="true"
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                flex: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: item.done ? "none" : "2px dashed var(--p-border)",
                background: item.done ? "var(--p-success)" : "transparent",
                color: "#fff",
              }}
            >
              {item.done ? <KIcon name="Check" size={12} /> : null}
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: item.done ? "line-through" : "none",
                color: item.done ? "var(--p-text-3)" : "var(--p-text-1)",
              }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    );

  // PPE chips render inside their own section when the task carries any.
  const ppeNode =
    task.ppe.length === 0 ? null : (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {task.ppe.map((p) => (
          <span key={p} className="ps-tag">
            {p}
          </span>
        ))}
      </div>
    );

  const sections = [
    { h: labels.status, node: lifecycle },
    {
      h: labels.description,
      text: task.description || labels.descriptionEmpty,
    },
    ...(ppeNode ? [{ h: labels.ppe, node: ppeNode }] : []),
    ...(checklistNode ? [{ h: labels.checklist, node: checklistNode }] : []),
    { h: labels.photos, node: photosNode },
    timeline.length
      ? { h: labels.activity, timeline }
      : { h: labels.activity, text: labels.activityEmpty },
  ];

  return (
    <RecordDetail
      eyebrow={labels.eyebrow}
      title={task.title}
      icon="ClipboardCheck"
      status={{ tone: stateTone(state), label: stateLabel[state] }}
      fields={fields}
      sections={sections}
      comments={comments}
      people={[]}
      onComment={onComment}
      onClose={() => router.push("/m/tasks")}
    />
  );
}
