/**
 * Side-effect barrel — importing this module registers every shipped action
 * with the in-memory `actionRegistry`. The Step Builder page imports this on
 * the server so `listActions()` returns the full inventory before the client
 * component is rendered.
 *
 * The runner (`src/lib/automations/run.ts`) does its own per-action imports
 * because it lives in a `server-only` module and we want the registry to be
 * deterministic at runtime.
 */

import "./notify";
import "./email-send";
import "./webhook-send";
import "./record-update";
import "./delay";
import "./advance-escalate";
import "./daysheet-draft-from-advance";
import "./credentials-batch-issue";
import "./settlement-settle";

export {};
