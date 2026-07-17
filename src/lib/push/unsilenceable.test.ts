import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { UNSILENCEABLE_KINDS } from "./send";

/**
 * Crisis fan-out guard (COMPVSS mobile parity audit, D8).
 *
 * `createCrisisAlertAction` inserted a `crisis_alerts` row and stopped. No
 * notification, no push. The console could declare an emergency and the
 * workforce would find out by opening the app and happening to look —
 * while the field's alert feed shipped a `crisis` tone that nothing could
 * produce.
 *
 * Two properties, both safety-critical, both easy to undo by accident:
 *
 *  1. The declaration path fans out. A future refactor that drops the
 *     sendPushBulk call restores the silence.
 *  2. A crisis cannot be muted. The per-kind opt-out matrix is correct for
 *     announcements and kudos; someone who muted "alerts" months ago has
 *     not consented to missing an evacuation. Adding `crisis` to the
 *     matrix without this exemption would silently re-enable that.
 */
const ROOT = process.cwd();

describe("crisis alerts reach the field", () => {
  it("marks crisis as unsilenceable", () => {
    expect(UNSILENCEABLE_KINDS.has("crisis")).toBe(true);
  });

  it("fans the declaration out to the whole org, not the manager band", () => {
    const src = readFileSync(join(ROOT, "src/app/(platform)/studio/safety/crisis/new/actions.ts"), "utf8");
    expect(src).toMatch(/sendPushBulk\(/);
    // Every active member — an evacuation is not an escalation.
    expect(src).toMatch(/orgMemberUserIds\(/);
    expect(src).not.toMatch(/managerUserIds\(/);
    // Tagged so the field's alert surface can tone it.
    expect(src).toMatch(/kind:\s*"crisis"/);
  });

  it("does not roll back the alert when the fan-out fails", () => {
    const src = readFileSync(join(ROOT, "src/app/(platform)/studio/safety/crisis/new/actions.ts"), "utf8");
    // The row is already recorded; a push failure must not block the
    // declarer, who has somewhere more important to be.
    expect(src).toMatch(/try\s*\{[\s\S]*sendPushBulk[\s\S]*\}\s*catch/);
  });
});
