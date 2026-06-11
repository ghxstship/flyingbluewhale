/**
 * Streaming loading state for the auth shell. Renders a centered form
 * ps-skel so cold navigation to /login, /signup, /reset-password feels
 * branded instead of blank-white during the first server flush.
 */
import { PageSkeleton } from "@/components/Shell";

export default function Loading() {
  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <PageSkeleton variant="form" rows={3} />
    </div>
  );
}
