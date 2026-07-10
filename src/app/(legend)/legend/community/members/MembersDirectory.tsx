"use client";

import { Avatar } from "@/components/ui/Avatar";
import { DataView, type DataViewColumn } from "@/components/ui/DataView";
import { useFormatters } from "@/lib/i18n/LocaleProvider";

export type DirectoryMember = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string | null;
  points: number;
};

/**
 * Client wrapper for the members directory. Defines the <DataView> columns
 * here (render functions can't cross the RSC boundary) and toggles between a
 * table and an avatar card grid.
 */
export function MembersDirectory({ members }: { members: DirectoryMember[] }) {
  const fmt = useFormatters();
  const columns: DataViewColumn<DirectoryMember>[] = [
    {
      key: "member",
      header: "Member",
      render: (m) => (
        <span className="flex items-center gap-2">
          <Avatar size="sm" name={m.name} src={m.avatar_url ?? undefined} />
          <span className="text-[var(--p-text-1)]">{m.name}</span>
        </span>
      ),
    },
    { key: "role", header: "Role", render: (m) => <span className="text-[var(--p-text-2)] capitalize">{m.role ?? "—"}</span> },
    { key: "points", header: "Points", align: "right", render: (m) => <span className="tabular-nums font-medium">{fmt.number(m.points)}</span> },
  ];

  return (
    <DataView
      items={members}
      columns={columns}
      getKey={(m) => m.id}
      defaultView="grid"
      emptyLabel="No members yet"
      renderCard={(m) => (
        <div className="flex flex-col items-center gap-2 text-center">
          <Avatar size="xl" name={m.name} src={m.avatar_url ?? undefined} />
          <div className="text-sm font-semibold text-[var(--p-text-1)]">{m.name}</div>
          {m.role && <div className="text-xs capitalize text-[var(--p-text-2)]">{m.role}</div>}
          <div className="text-xs font-medium text-[var(--p-accent)]">{fmt.number(m.points)} pts</div>
        </div>
      )}
    />
  );
}
