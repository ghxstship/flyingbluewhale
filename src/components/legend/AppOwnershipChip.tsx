import { APP_LABEL, APP_TOKEN, type DepartmentApp } from "@/lib/xpms/app-ownership";

/**
 * AppOwnershipChip — the app-canon consumption chip (LEG3ND P4, first real
 * consumer of `dim_department.app`).
 *
 * Renders the owning app's wordmark tinted from that app's `--brand-*`
 * identity token family (each product OWNS its accent, v8.0 palette-locked):
 * text on the AA `-text` role, fill a low-opacity color-mix of the raw
 * accent. Token-only — no hex literals. Server-safe (no hooks).
 */
export function AppOwnershipChip({
  app,
  title,
  className,
}: {
  app: DepartmentApp;
  /** Optional hover context, e.g. "6000 Operations · COMPVSS". */
  title?: string;
  className?: string;
}) {
  const token = APP_TOKEN[app];
  return (
    <span
      className={`ps-id inline-flex shrink-0 items-center rounded-full border px-1.5 py-px text-[11px] leading-4 tracking-wide ${className ?? ""}`}
      style={{
        color: token.fg,
        background: `color-mix(in srgb, ${token.base} 10%, transparent)`,
        borderColor: `color-mix(in srgb, ${token.base} 35%, transparent)`,
      }}
      title={title}
    >
      {APP_LABEL[app]}
    </span>
  );
}
