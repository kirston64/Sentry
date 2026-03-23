"use client";

import { use, useState, useCallback } from "react";
import { clsx } from "clsx";
import {
  Users, Clock, Cpu, HardDrive, Activity, Globe, Wifi, Server as ServerIcon,
} from "lucide-react";
import { useInterval } from "@/hooks/useInterval";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ServerStatusDot } from "@/components/servers/server-status-dot";
import { GaugeBar } from "@/components/servers/gauge-bar";
import { LineChart } from "@/components/charts/line-chart";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SERVERS, BASE_METRICS, PLAYER_HISTORY_24H, DEPLOYS, SEED_INCIDENTS } from "@/lib/mock-data";
import type { ServerMetrics } from "@/types/server";
import type { Incident } from "@/types/incident";

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}д ${h}ч ${m}м`;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

function jitter(base: number, range: number, min: number, max: number) {
  const val = base + (Math.random() - 0.5) * 2 * range;
  return Math.min(max, Math.max(min, Math.round(val)));
}

const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const server = SERVERS.find((s) => s.id === id);
  const [incidents] = useLocalStorage<Incident[]>("sentry_incidents", SEED_INCIDENTS);

  const baseMetrics = BASE_METRICS[id] ?? { playersOnline: 0, cpuPercent: 0, ramPercent: 0, uptimeSeconds: 0, tickRate: 0 };
  const [metrics, setMetrics] = useState<ServerMetrics>(baseMetrics);

  const isOnline = server?.status === "online";

  const tick = useCallback(() => {
    if (!isOnline || !server) return;
    setMetrics((prev) => ({
      playersOnline: jitter(prev.playersOnline, 3, 0, server.maxPlayers),
      cpuPercent: jitter(prev.cpuPercent, 4, 5, 98),
      ramPercent: jitter(prev.ramPercent, 2, 10, 95),
      uptimeSeconds: prev.uptimeSeconds + 3,
      tickRate: jitter(prev.tickRate, 1, 58, 66),
    }));
  }, [isOnline, server]);

  useInterval(tick, isOnline ? 3000 : null);

  if (!server) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-muted">Сервер не найден</p>
      </div>
    );
  }

  // Related deploys for this server
  const env = server.name.includes("Dev") ? "development" : server.name.includes("Event") ? "staging" : "production";
  const serverDeploys = DEPLOYS.filter((d) => d.environment === env).slice(0, 5);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Servers", href: "/servers" },
        { label: server.name },
      ]} />

      {/* Header */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
            <ServerIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary">{server.name}</h1>
              <ServerStatusDot status={server.status} />
              <span className={clsx("text-xs font-medium", isOnline ? "text-success" : "text-error")}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> {server.ip}:{server.port}</span>
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {server.mapName}</span>
              <span>{server.gameMode}</span>
            </div>
          </div>
        </div>
      </div>

      {isOnline ? (
        <>
          {/* Live metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-text-muted" />
                <p className="text-lg font-bold text-text-primary">{metrics.playersOnline}</p>
              </div>
              <p className="text-[10px] text-text-muted">/ {server.maxPlayers} игроков</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-text-muted" />
                <p className={clsx("text-lg font-bold", metrics.cpuPercent > 80 ? "text-error" : metrics.cpuPercent > 60 ? "text-warning" : "text-success")}>{metrics.cpuPercent}%</p>
              </div>
              <p className="text-[10px] text-text-muted">CPU</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <HardDrive className="h-3.5 w-3.5 text-text-muted" />
                <p className={clsx("text-lg font-bold", metrics.ramPercent > 85 ? "text-error" : metrics.ramPercent > 65 ? "text-warning" : "text-success")}>{metrics.ramPercent}%</p>
              </div>
              <p className="text-[10px] text-text-muted">RAM</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <p className="text-lg font-bold text-text-primary">{metrics.tickRate}</p>
              <p className="text-[10px] text-text-muted">Tick Rate</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-text-muted" />
                <p className="text-lg font-bold text-text-primary">{formatUptime(metrics.uptimeSeconds).split(" ")[0]}</p>
              </div>
              <p className="text-[10px] text-text-muted">Uptime</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3 text-center">
              <p className={clsx("text-lg font-bold", metrics.tickRate >= 60 ? "text-success" : "text-warning")}>
                {metrics.tickRate >= 60 ? "Stable" : "Degraded"}
              </p>
              <p className="text-[10px] text-text-muted">Health</p>
            </div>
          </div>

          {/* Gauges */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="mb-3 text-xs font-medium text-text-primary">CPU Usage</h3>
              <GaugeBar label="CPU" value={metrics.cpuPercent} />
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="mb-3 text-xs font-medium text-text-primary">Memory Usage</h3>
              <GaugeBar label="RAM" value={metrics.ramPercent} />
            </div>
          </div>

          {/* Player chart */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="mb-3 text-xs font-medium text-text-primary">Игроки за 24 часа</h3>
            <div className="h-40">
              <LineChart
                data={PLAYER_HISTORY_24H}
                color="#007fd4"
                labels={HOURS.filter((_, i) => i % 4 === 0)}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-error/40 bg-error/10 p-8 text-center">
          <ServerIcon className="h-8 w-8 text-error mx-auto mb-2" />
          <p className="text-sm text-error font-medium">Сервер офлайн</p>
          <p className="text-xs text-text-muted mt-1">Последние данные недоступны</p>
        </div>
      )}

      {/* Recent deploys for this server */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium text-text-primary">Последние деплои ({env})</h3>
        </div>
        <div className="divide-y divide-border">
          {serverDeploys.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-text-muted">Нет деплоев</p>
          ) : (
            serverDeploys.map((dep) => (
              <div key={dep.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={clsx("text-xs font-medium", dep.status === "success" ? "text-success" : dep.status === "failed" ? "text-error" : "text-warning")}>
                  {dep.status === "success" ? "OK" : dep.status === "failed" ? "FAIL" : dep.status.toUpperCase()}
                </span>
                <span className="text-xs text-accent">{dep.version}</span>
                <span className="flex-1 text-[10px] text-text-muted truncate">{dep.commitMsg}</span>
                <span className="text-[10px] text-text-muted">{new Date(dep.startedAt).toLocaleDateString("ru-RU")}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
