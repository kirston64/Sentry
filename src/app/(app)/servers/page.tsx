"use client";

import { useState, useEffect } from "react";
import { Server as ServerIcon } from "lucide-react";
import { ServerCard } from "@/components/servers/server-card";
import type { Server, ServerMetrics } from "@/types/server";

interface ServerData extends Server {
  metrics: ServerMetrics;
}

export default function ServersPage() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/servers").then(r => r.json()).then(setServers).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-48 animate-pulse rounded-lg bg-surface" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ServerIcon className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Servers</h1>
        <span className="ml-2 text-xs text-text-muted">
          {servers.filter((s) => s.status === "online").length} / {servers.length} онлайн
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {servers.map((server) => (
          <ServerCard
            key={server.id}
            server={server}
            baseMetrics={server.metrics}
          />
        ))}
      </div>
    </div>
  );
}
