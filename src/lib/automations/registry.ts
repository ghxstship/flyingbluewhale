import type { z, ZodTypeAny } from "zod";

/**
 * Action registry — the per-action-type interface that the runner walks.
 *
 * Each action ships its own schema + handler. Registering pushes the action
 * into the `actionRegistry` map keyed by `type`. The runner looks up the
 * handler by `step.type`, validates `step.input` (after `{{...}}` resolution)
 * via `schema.parse()`, then calls `run(input, ctx)`.
 *
 * The `output` returned from `run` is what subsequent steps can reference via
 * `{{step.<index>.output.<field>}}`. Always return at least `{ ok: true }` so
 * downstream conditional branches have something to test.
 */

export type ActionContext = {
  /** Org of the run owner. All DB writes inside actions MUST be scoped to this. */
  orgId: string;
  /** ID of the parent automation_runs row. */
  runId: string;
  /** ID of the source automation row. */
  automationId: string;
  /** Zero-based step index inside the automation. */
  stepIndex: number;
  /** Outputs of all prior steps, indexed by their step index. */
  steps: unknown[];
  /** The trigger payload that started this run. */
  trigger: Record<string, unknown>;
  /** User who triggered the run (manual/button). null for schedule/event/webhook. */
  actorId?: string;
};

export type ActionResult = {
  output: unknown;
};

export type ActionHandler<S extends ZodTypeAny = ZodTypeAny> = {
  type: string;
  schema: S;
  /** Human label for the step builder. */
  label: string;
  /** One-line description shown in the action picker. */
  description: string;
  run: (input: z.infer<S>, ctx: ActionContext) => Promise<ActionResult>;
};

export const actionRegistry: Record<string, ActionHandler> = {};

export function registerAction<S extends ZodTypeAny>(action: ActionHandler<S>): void {
  actionRegistry[action.type] = action as unknown as ActionHandler;
}

export function getAction(type: string): ActionHandler | undefined {
  return actionRegistry[type];
}

/** Snapshot of currently-registered action types (for the step builder UI). */
export function listActions(): Array<Pick<ActionHandler, "type" | "label" | "description">> {
  return Object.values(actionRegistry).map((a) => ({
    type: a.type,
    label: a.label,
    description: a.description,
  }));
}
