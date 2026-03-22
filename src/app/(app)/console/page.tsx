"use client";

import { useState } from "react";
import { TerminalSquare } from "lucide-react";
import { Terminal } from "@/components/console/terminal";
import { SERVERS } from "@/lib/mock-data";
import { clsx } from "clsx";

export default function ConsolePage() {
  const onlineServers = SERVERS.filter((s) => s.status === "online");
  const [activeServer, setActiveServer] = useState(onlineServers[0]?.id ?? "");

  const server = SERVERS.find((s) => s.id === activeServer);

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col gap-4">
      <div className="flex items-center gap-2">
        <TerminalSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Console</h1>
      </div>

      {/* Server tabs */}
      <div className="flex gap-1">
        {SERVERS.map((s) => (
          <button
            key={s.id}
            onClick={() => s.status === "online" && setActiveServer(s.id)}
            disabled={s.status !== "online"}
            className={clsx(
              "rounded-t-md px-3 py-1.5 text-xs transition-colors",
              activeServer === s.id
                ? "bg-[#0c0c0c] text-text-primary border border-b-0 border-border"
                : s.status === "online"
                ? "bg-surface text-text-muted hover:text-text-secondary"
                : "bg-surface text-text-muted/50 cursor-not-allowed"
            )}
          >
            <span
              className={clsx(
                "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
                s.status === "online" ? "bg-success" : "bg-error"
              )}
            />
            {s.name}
          </button>
        ))}
      </div>

      {/* Terminal */}
      <div className="flex-1 -mt-1">
        {server ? (
          <Terminal key={activeServer} serverName={server.name} />
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted">
            Нет доступных серверов
          </div>
        )}
      </div>
    </div>
  );
}
