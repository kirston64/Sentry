"use client";

import { Server as ServerIcon } from "lucide-react";
import { ServerCard } from "@/components/servers/server-card";
import { SERVERS, BASE_METRICS } from "@/lib/mock-data";

export default function ServersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ServerIcon className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Servers</h1>
        <span className="ml-2 text-xs text-text-muted">
          {SERVERS.filter((s) => s.status === "online").length} / {SERVERS.length} онлайн
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {SERVERS.map((server) => (
          <ServerCard
            key={server.id}
            server={server}
            baseMetrics={BASE_METRICS[server.id]}
          />
        ))}
      </div>
    </div>
  );
}
