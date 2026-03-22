"use client";

import Link from "next/link";
import { ServerStatusDot } from "@/components/servers/server-status-dot";
import { SERVERS } from "@/lib/mock-data";
import { Server } from "lucide-react";

export function ServerStatusWidget() {
  return (
    <Link
      href="/servers"
      className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-focus"
    >
      <Server className="h-4 w-4 text-text-muted" />
      {SERVERS.map((s) => (
        <div key={s.id} className="flex items-center gap-1.5 text-xs">
          <ServerStatusDot status={s.status} />
          <span className="text-text-secondary">{s.name}</span>
        </div>
      ))}
    </Link>
  );
}
