import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACCEPTED_EVENT_INPUTS,
  DEPRECATED_EVENT_ALIASES,
  SUBSCRIBABLE_EVENTS,
  WEBHOOK_EVENTS,
  normalizeWebhookEvent,
} from "./events";

/**
 * Guards the one-list invariant.
 *
 * The emitter (`notify.ts#NotifyEvent`) and the subscribe allow-list
 * (`/api/v1/webhooks/endpoints#PostSchema`) were two hand-maintained
 * copies with nothing binding them, and they drifted: `ticket.scanned`
 * stayed subscribable after the 0067 rename and could never fire. These
 * tests fail if a second literal list reappears in either place.
 */
describe("webhook event registry", () => {
  it("emits and accepts subscriptions from the same set", () => {
    for (const event of WEBHOOK_EVENTS) {
      expect(SUBSCRIBABLE_EVENTS).toContain(event);
    }
    // Subscribable adds exactly the wildcard, nothing else.
    expect(SUBSCRIBABLE_EVENTS.length).toBe(WEBHOOK_EVENTS.length + 1);
    expect(SUBSCRIBABLE_EVENTS).toContain("*");
  });

  it("has no duplicate event names", () => {
    expect(new Set(WEBHOOK_EVENTS).size).toBe(WEBHOOK_EVENTS.length);
  });

  it("names every event <noun>.<verb>", () => {
    for (const event of WEBHOOK_EVENTS) {
      expect(event, `${event} should be dot-namespaced`).toMatch(/^[a-z_]+\.[a-z_]+$/);
    }
  });

  it("does not carry a retired name as a live event", () => {
    // ticket.scanned was renamed to assignment.scanned in migration 0067.
    expect(WEBHOOK_EVENTS).not.toContain("ticket.scanned" as never);
    expect(WEBHOOK_EVENTS).toContain("assignment.scanned");
  });

  it("still accepts retired aliases on input and normalizes them", () => {
    expect(ACCEPTED_EVENT_INPUTS).toContain("ticket.scanned");
    expect(normalizeWebhookEvent("ticket.scanned")).toBe("assignment.scanned");
  });

  it("maps every alias onto a live event", () => {
    for (const [alias, target] of Object.entries(DEPRECATED_EVENT_ALIASES)) {
      expect(WEBHOOK_EVENTS, `${alias} points at a dead target`).toContain(target);
      expect(WEBHOOK_EVENTS, `${alias} is still live and should not be aliased`).not.toContain(alias as never);
    }
  });

  it("passes live events and the wildcard through unchanged", () => {
    expect(normalizeWebhookEvent("invoice.paid")).toBe("invoice.paid");
    expect(normalizeWebhookEvent("*")).toBe("*");
  });

  // The structural guard: the drift happened because a literal list was
  // copied. Fail if either consumer grows its own again.
  it("is the only list — consumers import it rather than redeclaring", () => {
    const root = process.cwd();
    const notify = readFileSync(join(root, "src/lib/notify.ts"), "utf8");
    const route = readFileSync(join(root, "src/app/api/v1/webhooks/endpoints/route.ts"), "utf8");

    expect(notify).toContain('from "./webhooks/events"');
    expect(route).toContain('from "@/lib/webhooks/events"');

    // A re-copied list would have to name real events to be useful.
    // `notify.ts` legitimately mentions event names in its usage docblock,
    // so assert on the union/tuple shape rather than any mention.
    expect(notify).not.toMatch(/\|\s*"(project\.created|invoice\.paid|assignment\.scanned)"/);
    expect(route).not.toMatch(/const\s+EVENTS\s*=\s*\[/);
  });
});
