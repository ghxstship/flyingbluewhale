import { z } from "zod";
import { registerAction } from "../registry";

/**
 * In-process delay. Bounded at 30 seconds — anything longer should be
 * rescheduled via the job queue (Phase 4.3 — schedule trigger lands the
 * `runAt` re-enqueue path). Holding the runner open beyond ~30s starves the
 * other automations queued behind it.
 */
const MAX_INLINE_SECONDS = 30;

const Schema = z.object({
  seconds: z.number().min(0).max(MAX_INLINE_SECONDS),
});

registerAction({
  type: "delay",
  schema: Schema,
  label: "Delay",
  description: `Pauses the run for up to ${MAX_INLINE_SECONDS}s. Longer delays must use the schedule trigger.`,
  async run(input, _ctx) {
    if (input.seconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, input.seconds * 1000));
    }
    return { output: { waitedSeconds: input.seconds } };
  },
});

export { MAX_INLINE_SECONDS };
