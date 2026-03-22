"use client";

import { useState, useCallback } from "react";
import { useInterval } from "@/hooks/useInterval";
import { ServerStatusDot } from "./server-status-dot";
import { GaugeBar } from "./gauge-bar";
import { PlayerChart } from "./player-chart";
import { Users, Clock } from "lucide-react";
import type { Server, ServerMetrics } from "@/types/server";

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}д ${h}ч`;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

function jitter(base: number, range: number, min: number, max: number) {
  const val = base + (Math.random() - 0.5) * 2 * range;
  return Math.min(max, Math.max(min, Math.round(val)));
}

interface ServerCardProps {
  server: Server;
  baseMetrics: ServerMetrics;
}

export function ServerCard({ server, baseMetrics }: ServerCardProps) {
  const isOnline = server.status === "online";

  const [metrics, setMetrics] = useState<ServerMetrics>(baseMetrics);
  const [history, setHistory] = useState<number[]>(() => {
    const arr: number[] = [];
    for (let i = 0; i < 20; i++) {
      arr.push(jitter(baseMetrics.playersOnline, 8, 0, server.maxPlayers));
    }
    return arr;
  });

  const tick = useCallback(() => {
    if (!isOnline) return;
    setMetrics((prev) => ({
      playersOnline: jitter(prev.playersOnline, 3, 0, server.maxPlayers),
      cpuPercent: jitter(prev.cpuPercent, 4, 5, 98),
      ramPercent: jitter(prev.ramPercent, 2, 10, 95),
      uptimeSeconds: prev.uptimeSeconds + 3,
      tickRate: jitter(prev.tickRate, 1, 58, 66),
    }));
    setHistory((prev) => {
      const next = [...prev.slice(1), jitter(metrics.playersOnline, 3, 0, server.maxPlayers)];
      return next;
    });
  }, [isOnline, server.maxPlayers, metrics.playersOnline]);

  useInterval(tick, isOnline ? 3000 : null);

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden transition-transform hover:scale-[1.02]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <ServerStatusDot status={server.status} />
          <div>
            <h3 className="text-sm font-medium text-text-primary">{server.name}</h3>
            <p className="text-[10px] text-text-muted">
              {server.ip}:{server.port} &middot; {server.gameMode}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm font-medium text-text-primary">
            <Users className="h-3.5 w-3.5 text-text-muted" />
            <span>{metrics.playersOnline}</span>
            <span className="text-text-muted">/ {server.maxPlayers}</span>
          </div>
          {isOnline && (
            <div className="flex items-center gap-1 text-[10px] text-text-muted">
              <Clock className="h-3 w-3" />
              {formatUptime(metrics.uptimeSeconds)}
            </div>
          )}
        </div>
      </div>

      {isOnline ? (
        <>
          {/* Gauges */}
          <div className="grid grid-cols-2 gap-3 px-4 py-3">
            <GaugeBar label="CPU" value={metrics.cpuPercent} />
            <GaugeBar label="RAM" value={metrics.ramPercent} />
          </div>

          {/* Sparkline */}
          <div className="border-t border-border px-4 py-2">
            <p className="mb-1 text-[10px] text-text-muted">Игроки (последние 60с)</p>
            <PlayerChart data={history} />
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2 flex justify-between text-[10px] text-text-muted">
            <span>Tick Rate: {metrics.tickRate}</span>
            <span>{server.mapName}</span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-8 text-sm text-text-muted">
          Сервер офлайн
        </div>
      )}
    </div>
  );
}
