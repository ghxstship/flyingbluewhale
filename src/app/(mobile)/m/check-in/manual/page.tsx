import { ManualEntry } from "./ManualEntry";

export const dynamic = "force-dynamic";

/**
 * /m/check-in/manual — server wrapper for the surviving `ManualEntry` client
 * island (camera-less code-entry fallback for the field check-in scanner).
 */
export default function ManualEntryPage() {
  return (
    <div className="screen screen-anim">
      <ManualEntry />
    </div>
  );
}
