"use client";

import Link from "next/link";
import { ServerStatusDot } from "./server-status-dot";
import { GaugeBar } from "./gauge-bar";
import { Users, Clock, Terminal, AlertCircle, Loader2 } from "lucide-react";
import type { Server, ServerMetrics } from "@/types/server";

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}д ${h}ч`;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

interface ConnectedUser { user: string; ip: string; since: string; }

interface ExtendedMetrics extends ServerMetrics {
  diskPercent?: number;
  activeUsers?: number;
  connectedUsers?: ConnectedUser[];
}

interface ServerCardProps {
  server: Server & { type?: string; collectError?: string | null; hasSSH?: boolean; lastSeenAt?: string | null };
  baseMetrics: ExtendedMetrics;
}

export function ServerCard({ server, baseMetrics }: ServerCardProps) {
  const isOnline = server.status === "online";
  const isLinux = server.type === "linux";
  const isConnecting = !isOnline && server.hasSSH && !server.collectError && !server.lastSeenAt;
  const metrics = baseMetrics;

  return (
    <Link
      href={`/servers/${server.id}`}
      className="block rounded-lg border border-border bg-surface overflow-hidden transition-transform hover:scale-[1.02]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <ServerStatusDot status={server.status} />
          <div>
            <h3 className="text-sm font-medium text-text-primary">{server.name}</h3>
            <p className="text-[10px] text-text-muted">
              {server.ip}:{server.port}
              {isLinux ? " · Linux" : ` · ${(server as unknown as { gameMode: string }).gameMode || "Game"}`}
            </p>
          </div>
        </div>

        {isOnline && (
          <div className="text-right">
            {isLinux ? (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Terminal className="h-3 w-3" />
                <span>{metrics.activeUsers ?? 0} сессий</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm font-medium text-text-primary">
                <Users className="h-3.5 w-3.5 text-text-muted" />
                <span>{metrics.playersOnline}</span>
                <span className="text-text-muted">/ {server.maxPlayers}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-[10px] text-text-muted mt-0.5">
              <Clock className="h-3 w-3" />
              {formatUptime(metrics.uptimeSeconds)}
            </div>
          </div>
        )}
      </div>

      {isOnline ? (
        <>
          <div className={`grid gap-3 px-4 py-3 ${isLinux ? "grid-cols-3" : "grid-cols-2"}`}>
            <GaugeBar label="CPU" value={metrics.cpuPercent} />
            <GaugeBar label="RAM" value={metrics.ramPercent} />
            {isLinux && (
              <GaugeBar label="Диск" value={metrics.diskPercent ?? 0} />
            )}
          </div>

          {!isLinux && (
            <div className="border-t border-border px-4 py-2 flex justify-between text-[10px] text-text-muted">
              <span>Tick: {metrics.tickRate}</span>
              <span>{(server as unknown as { mapName: string }).mapName || ""}</span>
            </div>
          )}

          {/* Connected SSH sessions */}
          {isLinux && metrics.connectedUsers && metrics.connectedUsers.length > 0 && (
            <div className="border-t border-border px-4 py-2 space-y-1">
              <p className="text-[10px] text-text-muted mb-1.5 font-medium uppercase tracking-wide">SSH сессии</p>
              {metrics.connectedUsers.map((u, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
                    <span className="font-mono text-text-primary">{u.user}</span>
                    <span className="text-text-muted">{u.ip}</span>
                  </div>
                  <span className="text-text-muted/60">{new Date(u.since).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="px-4 py-6 text-center">
          {isConnecting ? (
            <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Подключение по SSH...
            </div>
          ) : server.collectError ? (
            <div className="flex items-center justify-center gap-1.5 text-xs text-error">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-[200px]" title={server.collectError}>{server.collectError}</span>
            </div>
          ) : (
            <p className="text-sm text-text-muted">Сервер офлайн</p>
          )}
        </div>
      )}
    </Link>
  );
}
