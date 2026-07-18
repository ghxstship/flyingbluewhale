"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KIcon } from "./icon";
import {
  RECENT_RECORDS_EVENT,
  readRecentRecords,
  type RecentRecord,
} from "@/lib/mobile/recent-records";

/**
 * RecentRail — kit 32 C3. A "jump back in" rail of the last five records the
 * user opened, mounted at the top of /m/more. Reads the client-only
 * recently-viewed store; renders nothing until it has entries, so the server
 * shell never reserves empty space.
 *
 * Presentational for copy: the caller passes the already-translated heading.
 */
export function RecentRail({ heading }: { heading: string }) {
  const [items, setItems] = useState<RecentRecord[]>([]);

  useEffect(() => {
    const sync = () => setItems(readRecentRecords());
    sync();
    window.addEventListener(RECENT_RECORDS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(RECENT_RECORDS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!items.length) return null;

  return (
    <div style={{ marginBottom: 6 }}>
      <div className="sech" style={{ marginTop: 8 }}>
        <h2>{heading}</h2>
      </div>
      <div className="chips" style={{ paddingBottom: 10 }}>
        {items.map((r) => (
          <Link key={r.href} href={r.href} className="chip" style={{ textDecoration: "none", gap: 6 }}>
            <KIcon name={r.kind || "FileText"} size={13} />
            <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
