"use client";

import { useState } from "react";
import { TerminalSquare, Lock } from "lucide-react";
import { Terminal } from "@/components/console/terminal";
import { SERVERS } from "@/lib/mock-data";
import { useProfile } from "@/components/auth/profile-context";
import { canUseConsole } from "@/lib/rbac";
import { clsx } from "clsx";

export default function ConsolePage() {
  const profile = useProfile();
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
        {SERVERS.map((s) => {
          const isProd = s.gameMode !== "Development";
          const locked = !canUseConsole(profile.role, isProd ? "production" : "development");
          const disabled = s.status !== "online" || locked;

          return (
            <button
              key={s.id}
              onClick={() => !disabled && setActiveServer(s.id)}
              disabled={disabled}
              className={clsx(
                "rounded-t-md px-3 py-1.5 text-xs transition-colors flex items-center gap-1",
                activeServer === s.id && !locked
                  ? "bg-[#0c0c0c] text-text-primary border border-b-0 border-border"
                  : !disabled
                  ? "bg-surface text-text-muted hover:text-text-secondary"
                  : "bg-surface text-text-muted/50 cursor-not-allowed"
              )}
              title={locked ? `Консоль ${isProd ? "production" : "dev"} серверов требует роль Admin` : undefined}
            >
              <span
                className={clsx(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  s.status === "online" ? "bg-success" : "bg-error"
                )}
              />
              {s.name}
              {locked && <Lock className="h-3 w-3 ml-1 text-text-muted/40" />}
            </button>
          );
        })}
      </div>

      {/* Terminal */}
      <div className="flex-1 -mt-1">
        {server && canUseConsole(profile.role, server.gameMode !== "Development" ? "production" : "development") ? (
          <Terminal key={activeServer} serverName={server.name} />
        ) : server ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted">
            <Lock className="h-8 w-8 text-error/50" />
            <p className="text-sm">Нет доступа к консоли этого сервера</p>
            <p className="text-xs">Production консоль доступна для Admin и Owner</p>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted">
            Нет доступных серверов
          </div>
        )}
      </div>
    </div>
  );
}
