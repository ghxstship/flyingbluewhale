"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ZodTypeAny } from "zod";
import { Spinner } from "@/components/ui/Spinner";
import { actionRegistry } from "@/lib/automations/registry";
import { AddStepMenu, type RegisteredAction } from "./AddStepMenu";
import { StepCard } from "./StepCard";
import { TriggerEditor, type TriggerKind } from "./TriggerEditor";

export type AutomationStep = {
  id: string;
  type: string;
  config: Record<string, unknown>;
  /** Optional condition — Phase 4.5 lands this; the UI exposes a placeholder. */
  condition?: unknown;
};

type SaveResult = { error?: string; ok?: true } | null;

/**
 * Server-action callback shape — `useActionState`-compatible. The StepBuilder
 * builds a FormData with the serialized payload, then awaits the action.
 */
type SaveStepsServerAction = (prev: SaveResult, fd: FormData) => Promise<SaveResult>;
type SaveTriggerServerAction = (prev: SaveResult, fd: FormData) => Promise<SaveResult>;

export type StepBuilderProps = {
  automationId: string;
  initialSteps: AutomationStep[];
  initialTrigger: { kind: string; config: Record<string, unknown> };
  registeredActions: RegisteredAction[];
  /**
   * Server action bound to the current automation id. Receives a FormData with
   * `steps` set to a JSON-serialized array.
   */
  saveStepsAction: SaveStepsServerAction;
  /**
   * Server action bound to the current automation id. Receives a FormData with
   * `kind` and `config` (JSON-serialized) fields.
   */
  saveTriggerAction: SaveTriggerServerAction;
  /** Webhook URL for the trigger editor (Phase 4.3). */
  webhookUrl?: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `step_${Math.random().toString(36).slice(2, 10)}`;
}

const SAVE_DEBOUNCE_MS = 1500;

export function StepBuilder({
  initialSteps,
  initialTrigger,
  registeredActions,
  saveStepsAction,
  saveTriggerAction,
  webhookUrl,
}: StepBuilderProps) {
  const [steps, setSteps] = useState<AutomationStep[]>(() =>
    initialSteps.map((s) => ({
      id: s.id || genId(),
      type: s.type,
      config: s.config ?? {},
      condition: s.condition,
    })),
  );
  const [triggerKind, setTriggerKind] = useState<TriggerKind>((initialTrigger.kind as TriggerKind) ?? "manual");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(initialTrigger.config ?? {});

  const [stepStatus, setStepStatus] = useState<SaveStatus>("idle");
  const [stepError, setStepError] = useState<string | undefined>();
  const [trigStatus, setTrigStatus] = useState<SaveStatus>("idle");
  const [trigError, setTrigError] = useState<string | undefined>();

  // --- Auto-save with debounce ---------------------------------------------
  const stepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trigTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstStepRender = useRef(true);
  const isFirstTrigRender = useRef(true);

  const saveSteps = useCallback(
    async (next: AutomationStep[]) => {
      setStepStatus("saving");
      setStepError(undefined);
      try {
        const fd = new FormData();
        fd.set("steps", JSON.stringify(next));
        const res = await saveStepsAction(null, fd);
        if (res?.error) {
          setStepStatus("error");
          setStepError(res.error);
          return;
        }
        setStepStatus("saved");
      } catch (e) {
        setStepStatus("error");
        setStepError((e as Error).message);
      }
    },
    [saveStepsAction],
  );

  const saveTrigger = useCallback(
    async (kind: string, config: Record<string, unknown>) => {
      setTrigStatus("saving");
      setTrigError(undefined);
      try {
        const fd = new FormData();
        fd.set("kind", kind);
        fd.set("config", JSON.stringify(config));
        const res = await saveTriggerAction(null, fd);
        if (res?.error) {
          setTrigStatus("error");
          setTrigError(res.error);
          return;
        }
        setTrigStatus("saved");
      } catch (e) {
        setTrigStatus("error");
        setTrigError((e as Error).message);
      }
    },
    [saveTriggerAction],
  );

  useEffect(() => {
    if (isFirstStepRender.current) {
      isFirstStepRender.current = false;
      return;
    }
    if (stepTimer.current) clearTimeout(stepTimer.current);
    stepTimer.current = setTimeout(() => {
      void saveSteps(steps);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (stepTimer.current) clearTimeout(stepTimer.current);
    };
  }, [steps, saveSteps]);

  useEffect(() => {
    if (isFirstTrigRender.current) {
      isFirstTrigRender.current = false;
      return;
    }
    if (trigTimer.current) clearTimeout(trigTimer.current);
    trigTimer.current = setTimeout(() => {
      void saveTrigger(triggerKind, triggerConfig);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (trigTimer.current) clearTimeout(trigTimer.current);
    };
  }, [triggerKind, triggerConfig, saveTrigger]);

  // --- Drag-and-drop --------------------------------------------------------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setSteps((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  // --- Step manipulation ----------------------------------------------------
  const addStep = (type: string) => {
    setSteps((prev) => [...prev, { id: genId(), type, config: {} }]);
  };

  const updateStepConfig = (id: string, next: Record<string, unknown>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, config: next } : s)));
  };

  const deleteStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  // Build a quick lookup of registered action -> schema. The `actionRegistry`
  // is populated server-side on import; this client component imports it as a
  // side-effect-free reference so the schemas are available for form rendering.
  const schemaByType = useMemo(() => {
    const map = new Map<string, ZodTypeAny>();
    for (const t of Object.keys(actionRegistry)) {
      const a = actionRegistry[t];
      if (a) map.set(t, a.schema);
    }
    return map;
  }, []);

  const labelByType = useMemo(() => {
    const map = new Map<string, RegisteredAction>();
    for (const a of registeredActions) map.set(a.type, a);
    return map;
  }, [registeredActions]);

  const stepIds = steps.map((s) => s.id);

  return (
    <div className="flex flex-col gap-4">
      <TriggerEditor
        kind={triggerKind}
        config={triggerConfig}
        webhookUrl={webhookUrl}
        onKindChange={setTriggerKind}
        onConfigChange={setTriggerConfig}
      />
      <SaveIndicator label="Trigger" status={trigStatus} error={trigError} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Steps</h3>
          <SaveIndicator label="Steps" status={stepStatus} error={stepError} />
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-3">
              {steps.map((step, i) => {
                const meta = labelByType.get(step.type);
                return (
                  <li key={step.id}>
                    <StepCard
                      id={step.id}
                      index={i}
                      type={step.type}
                      label={meta?.label ?? step.type}
                      description={meta?.description}
                      schema={schemaByType.get(step.type)}
                      config={step.config}
                      onChange={(next) => updateStepConfig(step.id, next)}
                      onDelete={() => deleteStep(step.id)}
                    />
                  </li>
                );
              })}
            </ol>
          </SortableContext>
        </DndContext>

        {steps.length === 0 && (
          <div className="surface-inset flex flex-col items-center gap-2 rounded-md border border-dashed border-[var(--p-border)] p-6 text-center">
            <p className="text-sm text-[var(--p-text-2)]">No steps yet.</p>
            <p className="text-xs text-[var(--p-text-2)]">Add an action to get started.</p>
          </div>
        )}

        <div className="flex justify-center">
          <AddStepMenu registeredActions={registeredActions} onAdd={addStep} variant="secondary" />
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ label, status, error }: { label: string; status: SaveStatus; error?: string }) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--p-text-2)]">
        <Spinner size="xs" />
        Saving {label.toLowerCase()}…
      </span>
    );
  }
  if (status === "saved") {
    return <span className="text-[11px] text-[var(--p-success,var(--p-text-2))]">{label} saved</span>;
  }
  return (
    <span className="text-[11px] text-[var(--p-danger)]">
      {label} save failed: {error ?? "unknown error"}
    </span>
  );
}
