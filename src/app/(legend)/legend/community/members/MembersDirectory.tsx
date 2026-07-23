"use client";

import { Avatar } from "@/components/ui/Avatar";
import { DataView, type DataViewColumn } from "@/components/views/DataView";
import { useFormatters, useT } from "@/lib/i18n/LocaleProvider";

export type DirectoryMember = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string | null;
  points: number;
};

/**
 * Client wrapper for the members directory. Defines the canonical
 * `views/DataView` columns here (render functions can't cross the RSC
 * boundary) and toggles between a table and an avatar card grid.
 */
export function MembersDirectory({ members }: { members: DirectoryMember[] }) {
  const fmt = useFormatters();
  const t = useT();
  const columns: DataViewColumn<DirectoryMember>[] = [
    {
      key: "member",
      header: t("console.legend.community.directory.member", undefined, "Member"),
      render: (m) => (
        <span className="flex items-center gap-2">
          <Avatar size="sm" name={m.name} src={m.avatar_url ?? undefined} />
          <span className="text-[var(--p-text-1)]">{m.name}</span>
        </span>
      ),
      accessor: (m) => m.name,
    },
    {
      key: "role",
      header: t("console.legend.community.directory.role", undefined, "Role"),
      render: (m) => <span className="text-[var(--p-text-2)] capitalize">{m.role ?? "—"}</span>,
      accessor: (m) => m.role,
      filterable: true,
    },
    {
      key: "points",
      header: t("console.legend.community.directory.points", undefined, "Points"),
      numeric: true,
      render: (m) => <span className="font-medium">{fmt.number(m.points)}</span>,
      accessor: (m) => m.points,
    },
  ];

  return (
    <DataView
      tableId="legend-community-members"
      rows={members}
      columns={columns}
      views={["table", "gallery"]}
      defaultView="gallery"
      emptyLabel={t("console.legend.community.directory.empty", undefined, "No members yet")}
      gallery={{
        columns: 3,
        renderCard: (m) => (
          <div className="flex flex-col items-center gap-2 text-center">
            <Avatar size="xl" name={m.name} src={m.avatar_url ?? undefined} />
            <div className="text-sm font-semibold text-[var(--p-text-1)]">{m.name}</div>
            {m.role && <div className="text-xs capitalize text-[var(--p-text-2)]">{m.role}</div>}
            <div className="text-xs font-medium text-[var(--p-accent)]">
              {t("console.legend.community.directory.pts", { count: fmt.number(m.points) }, `${fmt.number(m.points)} pts`)}
            </div>
          </div>
        ),
      }}
    />
  );
}
