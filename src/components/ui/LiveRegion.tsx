"use client";

import * as React from "react";

/**
 * Polite live region for screen reader announcements.
 * Drop one near the root of any shell; call `useAnnounce()` to push messages.
 *
 * Example:
 *   const announce = useAnnounce();
 *   announce("Scan accepted"); // SR reads it
 */

type Priority = "polite" | "assertive";
type AnnouncementCtx = (msg: string, priority?: Priority) => void;

const Context = React.createContext<AnnouncementCtx | null>(null);

export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [polite, setPolite] = React.useState("");
  const [assertive, setAssertive] = React.useState("");
  const announce = React.useCallback<AnnouncementCtx>((msg, priority = "polite") => {
    const setter = priority === "assertive" ? setAssertive : setPolite;
    // Force a re-announce by clearing first
    setter("");
    requestAnimationFrame(() => setter(msg));
  }, []);
  return (
    <Context.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {polite}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertive}
      </div>
    </Context.Provider>
  );
}

export function useAnnounce(): AnnouncementCtx {
  const ctx = React.useContext(Context);
  if (!ctx) {
    // Safe no-op outside provider — never throw on accessibility helpers.
    return () => {};
  }
  return ctx;
}

/** Standalone live region — useful where the provider isn't mounted. */
export function LiveRegion({
  message,
  priority = "polite",
}: {
  message: string;
  priority?: Priority;
}) {
  return (
    <div
      role={priority === "assertive" ? "alert" : "status"}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
