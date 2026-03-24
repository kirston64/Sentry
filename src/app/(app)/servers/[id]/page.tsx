"use client";

import { use, useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  Users, Clock, Cpu, HardDrive, Activity, Globe, Wifi, Server as ServerIcon, CalendarClock, Plus, Power, Trash2,
} from "lucide-react";
import { ServerStatusDot } from "@/components/servers/server-status-dot";
import { GaugeBar } from "@/components/servers/gauge-bar";
import { MetricsCharts } from "@/components/servers/metrics-charts";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { useProfile } from "@/components/auth/profile-context";
import { hasRole } from "@/lib/rbac";
import type { ServerStatus } from "@/types/server";

interface Metrics {
  playersOnline: number;
  cpuPercent: number;
  ramPercent: number;
  uptimeSeconds: number;
  tickRate: number;
  createdAt?: string;
}

interface DeployInfo {
  id: string;
  version: string;
  environment: string;
  status: string;
  commitMsg: string;
  startedAt: string;
  user: { username: string; fullName: string };
}

interface ScheduledRestart {
  id: string;
  cronExpr: string;
  label: string | null;
  enabled: boolean;
  lastRunAt: string | null;
}

interface ServerData {
  id: string;
  name: string;
  ip: string;
  port: number;
  maxPlayers: number;
  status: string;
  gameMode: string;
  mapName: string;
  metrics: Metrics[];
  currentMetrics: Metrics | null;
  deploys: DeployInfo[];
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}д ${h}ч ${m}м`;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const profile = useProfile();
  const [server, setServer] = useState<ServerData | null>(null);
  const [restarts, setRestarts] = useState<ScheduledRestart[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCron, setNewCron] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const fetchData = async () => {
    try {
      const [srvRes, restartRes] = await Promise.all([
        fetch(`/api/servers/${id}`),
        fetch(`/api/servers/${id}/restarts`),
      ]);
      if (srvRes.ok) setServer(await srvRes.json());
      if (restartRes.ok) setRestarts(await restartRes.json());
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-surface" />
        <div className="h-32 animate-pulse rounded-lg bg-surface" />
        <div className="grid grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-surface" />)}
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-muted">Сервер не найден</p>
      </div>
    );
  }

  const metrics = server.currentMetrics || { playersOnline: 0, cpuPercent: 0, ramPercent: 0, uptimeSeconds: 0, tickRate: 0 };
  const isOnline = server.status === "online";

  const addRestart = async () => {
    if (!newCron.trim()) return;
    await fetch(`/api/servers/${id}/restarts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cronExpr: newCron, label: newLabel || null }),
    });
    setNewCron("");
    setNewLabel("");
    fetchData();
  };

  const toggleRestart = async (restartId: string, enabled: boolean) => {
    await fetch(`/api/servers/${id}/restarts/${restartId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    fetchData();
  };

  const deleteRestart = async (restartId: string) => {
    await fetch(`/api/servers/${id}/restarts/${restartId}`, { method: "DELETE" });
    fetchData();
  };

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
              <ServerStatusDot status={server.status as ServerStatus} />
              <span className={clsx("text-xs font-medium", isOnline ? "text-success" : server.status === "restarting" ? "text-warning" : "text-error")}>
                {isOnline ? "Online" : server.status === "restarting" ? "Restarting" : "Offline"}
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

        </>
      ) : (
        <div className="rounded-lg border border-error/40 bg-error/10 p-8 text-center">
          <ServerIcon className="h-8 w-8 text-error mx-auto mb-2" />
          <p className="text-sm text-error font-medium">{server.status === "restarting" ? "Сервер перезапускается..." : "Сервер офлайн"}</p>
          <p className="text-xs text-text-muted mt-1">Последние данные недоступны</p>
        </div>
      )}

      {/* Metrics charts */}
      <MetricsCharts serverId={id} />

      {/* Scheduled Restarts */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-text-muted" />
            <h3 className="text-sm font-medium text-text-primary">Расписание рестартов</h3>
          </div>
        </div>
        <div className="divide-y divide-border">
          {restarts.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <button
                onClick={() => toggleRestart(r.id, !r.enabled)}
                className={clsx("h-2 w-2 rounded-full", r.enabled ? "bg-success" : "bg-text-muted/30")}
                title={r.enabled ? "Активно" : "Отключено"}
              />
              <code className="text-xs text-accent font-mono">{r.cronExpr}</code>
              <span className="flex-1 text-xs text-text-muted truncate">{r.label || ""}</span>
              {r.lastRunAt && <span className="text-[10px] text-text-muted">Last: {new Date(r.lastRunAt).toLocaleString("ru-RU")}</span>}
              {hasRole(profile.role, "admin") && (
                <button onClick={() => deleteRestart(r.id)} className="text-text-muted hover:text-error transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {restarts.length === 0 && (
            <p className="px-4 py-4 text-center text-xs text-text-muted">Нет запланированных рестартов</p>
          )}
        </div>

        {/* Add restart form */}
        {hasRole(profile.role, "admin") && (
          <div className="border-t border-border px-4 py-3 flex items-center gap-2">
            <input
              type="text"
              value={newCron}
              onChange={(e) => setNewCron(e.target.value)}
              placeholder="0 6 * * *"
              className="w-28 rounded border border-border bg-bg px-2 py-1 text-xs text-text-primary font-mono outline-none focus:border-primary"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (optional)"
              className="flex-1 rounded border border-border bg-bg px-2 py-1 text-xs text-text-primary outline-none focus:border-primary"
            />
            <button
              onClick={addRestart}
              disabled={!newCron.trim()}
              className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary-hover disabled:opacity-50"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>
        )}
      </div>

      {/* Recent deploys */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium text-text-primary">Последние деплои</h3>
        </div>
        <div className="divide-y divide-border">
          {server.deploys.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-text-muted">Нет деплоев</p>
          ) : (
            server.deploys.map((dep) => (
              <div key={dep.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={clsx("text-xs font-medium", dep.status === "success" ? "text-success" : dep.status === "failed" ? "text-error" : "text-warning")}>
                  {dep.status === "success" ? "OK" : dep.status === "failed" ? "FAIL" : dep.status.toUpperCase()}
                </span>
                <span className="text-xs text-accent">{dep.version}</span>
                <span className="flex-1 text-[10px] text-text-muted truncate">{dep.commitMsg}</span>
                <span className="text-[10px] text-text-muted">{dep.user.fullName}</span>
                <span className="text-[10px] text-text-muted">{new Date(dep.startedAt).toLocaleDateString("ru-RU")}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
