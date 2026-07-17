// Single authoring site for the /m/notifications preference matrix axes.
// The notif-matrix categories (kit settings `.notif-matrix`, app.jsx
// 3336-3346) × the three delivery channels. Imported by both `page.tsx`
// (renders the matrix) and `actions.ts` (validates a single-cell toggle
// via `z.enum(...)`), so the two can never drift.
export const CATEGORIES = ["Shifts", "Assignments", "Reviews", "Messages", "Announcements"] as const;
export const CHANNELS = ["push", "email", "text"] as const;
