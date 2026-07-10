"use client";

// F-08 — token-gated public document tree error boundary. External clients
// land here from emailed links; show a calm, chrome-free retry instead of the
// root console boundary. Shared body: src/components/TokenShellError.tsx.
export { TokenShellError as default } from "@/components/TokenShellError";
