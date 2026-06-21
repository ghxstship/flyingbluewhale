"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RecordDetail } from "@/components/mobile/kit";
import {
  NEXT_TASK_STATES,
  TASK_STATES,
  stateTone,
  type TaskState,
} from "../_shared";
import { setTaskState } from "./actions";

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
  checklist: string;
  checklistEmpty: string;
  description: string;
  descriptionEmpty: string;
  activity: string;
  actCreated: string;
  actUpdated: string;
  permWarn: string;
  updated_toast: string;
};

export function TaskDetail({
  task,
  canTransition,
  labels,
}: {
  task: DetailTask;
  canTransition: boolean;
  labels: Labels;
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

  return (
    <RecordDetail
      eyebrow={labels.eyebrow}
      title={task.title}
      icon="ClipboardCheck"
      status={{ tone: stateTone(state), label: stateLabel[state] }}
      fields={[
        { k: labels.priority, v: task.priority },
        { k: labels.due, v: task.due },
        { k: labels.assignee, v: task.assignee },
        { k: labels.created, v: task.created },
      ]}
      sections={[
        { h: labels.status, node: lifecycle },
        {
          h: labels.description,
          text: task.description || labels.descriptionEmpty,
        },
        {
          h: labels.checklist,
          text: labels.checklistEmpty,
        },
        {
          h: labels.activity,
          timeline: [
            { icon: "Plus", txt: labels.actCreated, time: task.created },
            { icon: "Pencil", txt: labels.actUpdated, time: task.updated },
          ],
        },
      ]}
      comments={[]}
      people={[]}
      onComment={() => {
        /* No task_comments table — composer is a stub until one exists. */
      }}
      onClose={() => router.push("/m/tasks")}
    />
  );
}
