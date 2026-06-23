"use client";

import { useRouter, usePathname } from "next/navigation";
import { Combobox } from "@/components/ui/Combobox";

/**
 * Project switcher (workflow audit F-B). Lets an operator hop between projects
 * from any project sub-surface WITHOUT re-drilling through the Projects list —
 * and preserves the current tab, so "same view, different show" is one action.
 *
 * Mounted in the project detail layout; searchable (Combobox) so a long
 * portfolio stays usable.
 */
export function ProjectSwitcher({
  projects,
  currentId,
}: {
  projects: { id: string; name: string }[];
  currentId: string;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";

  function switchTo(newId: string) {
    if (!newId || newId === currentId) return;
    // /studio/projects/<id>/<tab…> → swap the id segment, keep the tab.
    const segs = pathname.split("/");
    if (segs[2] === "projects" && segs[3]) {
      segs[3] = newId;
      router.push(segs.join("/"));
    } else {
      router.push(`/studio/projects/${newId}/overview`);
    }
  }

  return (
    <Combobox
      options={projects.map((p) => ({ value: p.id, label: p.name }))}
      value={currentId}
      onChange={switchTo}
      placeholder="Switch project…"
      className="min-w-[14rem]"
      aria-label="Switch project"
    />
  );
}
