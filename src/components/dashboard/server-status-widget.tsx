"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ServerStatusDot } from "@/components/servers/server-status-dot";
import { Server } from "lucide-react";

interface ServerData {
  id: string;
  name: string;
  status: string;
}

export function ServerStatusWidget() {
  const [servers, setServers] = useState<ServerData[]>([]);

  useEffect(() => {
    fetch("/api/servers").then(r => r.json()).then(setServers);
  }, []);

  return (
    <Link
      href="/servers"
      className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-focus"
    >
      <Server className="h-4 w-4 text-text-muted" />
      {servers.map((s) => (
        <div key={s.id} className="flex items-center gap-1.5 text-xs">
          <ServerStatusDot status={s.status as "online" | "offline" | "restarting"} />
          <span className="text-text-secondary">{s.name}</span>
        </div>
      ))}
      {servers.length === 0 && <span className="text-xs text-text-muted">Загрузка...</span>}
    </Link>
  );
}
