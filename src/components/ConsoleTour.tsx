"use client";

import * as React from "react";
import { Tour, type TourStep } from "@/components/ui/Coachmark";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  CONSOLE_TOUR_EVENT,
  hasSeenConsoleTour,
  markConsoleTourSeen,
} from "@/lib/help/console-tour";

/**
 * Console product tour (the "app tour") — a first-run + on-demand spotlight walk
 * over the workspace chrome. Auto-launches ONCE per browser for the current tour
 * version (skippable at every step); replays whenever `startConsoleTour()` fires
 * `CONSOLE_TOUR_EVENT` (the Help menu "Take the tour").
 *
 * Steps target the `data-tour="…"` anchors added to the chrome. A step whose
 * target isn't present + visible right now is dropped, so the tour degrades
 * gracefully on narrow viewports (e.g. the ⌘K trigger is `hidden sm:inline-flex`)
 * and never spotlights an off-screen element.
 */
export function ConsoleTour() {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [steps, setSteps] = React.useState<TourStep[]>([]);

  const allSteps = React.useMemo<TourStep[]>(
    () => [
      {
        target: '[data-tour="nav"]',
        side: "right",
        title: t("tour.nav.title", undefined, "Find your way"),
        body: t(
          "tour.nav.body",
          undefined,
          "Every module lives in this rail. Pin the ones you use, switch role lenses, or search it. Nothing is more than a click away.",
        ),
      },
      {
        target: '[data-tour="create"]',
        side: "bottom",
        title: t("tour.create.title", undefined, "One front door"),
        body: t(
          "tour.create.body",
          undefined,
          "Create any record or file a request (gear, time off, an incident) from this one button. It's the only intake you have to learn.",
        ),
      },
      {
        target: '[data-tour="cmdk"]',
        side: "bottom",
        title: t("tour.cmdk.title", undefined, "Jump anywhere"),
        body: t(
          "tour.cmdk.body",
          undefined,
          "Press ⌘K to search across every page, record, and action. It's the fastest way to move around the console.",
        ),
      },
      {
        target: '[data-tour="notifications"]',
        side: "bottom",
        title: t("tour.notifications.title", undefined, "Stay in the loop"),
        body: t(
          "tour.notifications.body",
          undefined,
          "Approvals, mentions, and status changes land here. Click any alert to jump straight to the record.",
        ),
      },
      {
        target: '[data-tour="help"]',
        side: "bottom",
        title: t("tour.help.title", undefined, "Help is always here"),
        body: t(
          "tour.help.body",
          undefined,
          "Reach the Knowledge Base, What's New, and system status here, and replay this tour anytime with “Take the tour”.",
        ),
      },
    ],
    [t],
  );

  // Resolve to only the steps whose target is present + visible right now.
  const resolveSteps = React.useCallback(
    () =>
      allSteps.filter((s) => {
        if (typeof s.target !== "string") return true;
        const el = document.querySelector<HTMLElement>(s.target);
        return Boolean(el && el.getClientRects().length > 0);
      }),
    [allSteps],
  );

  const launch = React.useCallback(() => {
    const resolved = resolveSteps();
    if (resolved.length === 0) return;
    setSteps(resolved);
    setOpen(true);
  }, [resolveSteps]);

  // On-demand replay (Help menu).
  React.useEffect(() => {
    const onStart = () => launch();
    window.addEventListener(CONSOLE_TOUR_EVENT, onStart);
    return () => window.removeEventListener(CONSOLE_TOUR_EVENT, onStart);
  }, [launch]);

  // First-run: auto-launch once, after the chrome has settled.
  React.useEffect(() => {
    if (hasSeenConsoleTour()) return;
    const id = window.setTimeout(launch, 900);
    return () => window.clearTimeout(id);
  }, [launch]);

  const close = React.useCallback((completed: boolean) => {
    setOpen(false);
    markConsoleTourSeen(completed);
  }, []);

  return <Tour steps={steps} open={open} onClose={close} />;
}
