"use client";

import { useState, useEffect } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { ServerStatusWidget } from "@/components/dashboard/server-status-widget";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { FailedLoginsAlert } from "@/components/dashboard/failed-logins-alert";
import { ChartCard } from "@/components/charts/chart-card";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { RingChart } from "@/components/charts/ring-chart";
import {
  Server,
  AlertCircle,
  GitPullRequest,
  Users,
  Activity,
  AlertTriangle,
  Rocket,
  XCircle,
} from "lucide-react";
import Link from "next/link";

const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

interface DashboardData {
  servers: { id: string; name: string; ip: string; port: number; status: string; metrics: { playersOnline: number } }[];
  incidents: { id: string; title: string; severity: string; status: string }[];
  deploys: { id: string; version: string; environment: string; status: string; commitMsg: string }[];
  auditLogs: { id: string; action: string; target: string; createdAt: string; user: { username: string; fullName: string } }[];
  users: { id: string }[];
  playerHistory: number[];
  uptimePercent: number;
  commitActivity: { label: string; value: number }[];
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [servers, incidents, deploys, auditLogs, users, uptime] = await Promise.all([
        fetch("/api/servers").then(r => r.json()).catch(() => []),
        fetch("/api/incidents").then(r => r.json()).catch(() => []),
        fetch("/api/deploys").then(r => r.json()).catch(() => []),
        fetch("/api/audit?limit=5").then(r => r.json()).catch(() => []),
        fetch("/api/users").then(r => r.json()).catch(() => []),
        fetch("/api/uptime?days=7").then(r => r.json()).catch(() => []),
      ]);

      if (cancelled) return;

      // Calculate average uptime from all servers
      const uptimeArr = Array.isArray(uptime) ? uptime : [];
      const avgUptime = uptimeArr.length > 0
        ? Math.round(uptimeArr.reduce((s: number, u: { uptimePercent: number }) => s + u.uptimePercent, 0) / uptimeArr.length * 10) / 10
        : 99.7;

      // Generate commit activity from deploys (group by day of week)
      const commitActivity = DAYS.map((label, i) => {
        const dayDeploys = deploys.filter((d: { startedAt: string }) => {
          const day = new Date(d.startedAt).getDay();
          return (day === 0 ? 6 : day - 1) === i;
        });
        return { label, value: dayDeploys.length || 0 };
      });

      // Set initial data with empty player history
      setData({ servers, incidents, deploys, auditLogs, users, playerHistory: [], uptimePercent: avgUptime, commitActivity });

      // Fetch real player history for first server
      if (servers[0]?.id) {
        const srv = await fetch(`/api/servers/${servers[0].id}?range=24h`).then(r => r.json()).catch(() => null);
        if (!cancelled && srv?.metrics?.length > 1) {
          const playerHistory = srv.metrics.map((m: { playersOnline: number }) => m.playersOnline);
          setData(prev => prev ? { ...prev, playerHistory } : null);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 animate-pulse rounded-lg bg-surface" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-48 animate-pulse rounded-lg bg-surface" />)}
        </div>
      </div>
    );
  }

  const onlineServers = data.servers.filter((s) => s.status === "online").length;
  const offlineServers = data.servers.filter((s) => s.status === "offline");
  const failedDeploys = data.deploys.filter((d) => d.status === "failed");
  const activeIncidents = data.incidents.filter((i) => i.status !== "resolved");
  const hasProblems = offlineServers.length > 0 || failedDeploys.length > 0 || activeIncidents.length > 0;

  const playerData = data.playerHistory.length > 1 ? data.playerHistory : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <span className="text-xs text-text-muted">GTA 5 RP Dev-Ops</span>
      </div>

      <FailedLoginsAlert />

      {hasProblems && (
        <div className="rounded-lg border border-error/40 bg-error/10 p-4 animate-alert-pulse">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-error" />
            <h2 className="text-sm font-bold text-error">Обнаружены проблемы</h2>
          </div>
          <div className="space-y-2">
            {offlineServers.map((s) => (
              <Link key={s.id} href="/servers" className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors">
                <XCircle className="h-3.5 w-3.5 text-error shrink-0" />
                <span><span className="text-error font-medium">Сервер офлайн:</span> {s.name} ({s.ip}:{s.port})</span>
              </Link>
            ))}
            {failedDeploys.map((d) => (
              <Link key={d.id} href="/deploys" className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors">
                <Rocket className="h-3.5 w-3.5 text-error shrink-0" />
                <span><span className="text-error font-medium">Деплой упал:</span> {d.version} → {d.environment} ({d.commitMsg})</span>
              </Link>
            ))}
            {activeIncidents.map((inc) => (
              <Link key={inc.id} href={`/incidents/${inc.id}`} className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors">
                <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                <span><span className="text-warning font-medium">{inc.severity} {inc.status}:</span> {inc.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ServerStatusWidget />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Серверы онлайн" value={`${onlineServers} / ${data.servers.length}`} icon={Server} color="success" href="/servers" />
        <StatCard title="Активных инцидентов" value={activeIncidents.length} icon={AlertCircle} color="warning" href="/incidents" />
        <StatCard title="Деплоев сегодня" value={data.deploys.length} icon={GitPullRequest} color="primary" href="/deploys" />
        <StatCard title="Команда" value={`${data.users.length} чел.`} icon={Users} color="accent" href="/team" />
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ChartCard title="Игроки за 24ч">
          <div className="h-32">
            {playerData.length > 1 ? (
              <LineChart
                data={playerData}
                color="#007fd4"
                labels={playerData.map((_, i) =>
                  i % Math.max(1, Math.floor(playerData.length / 6)) === 0
                    ? HOURS[Math.round((i / playerData.length) * 23)]
                    : ""
                )}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-text-muted">
                Нет данных
              </div>
            )}
          </div>
        </ChartCard>
        <ChartCard title="Коммиты за неделю">
          <div className="h-32">
            <BarChart data={data.commitActivity} color="#4ec9b0" />
          </div>
        </ChartCard>
        <ChartCard title="Uptime" className="flex flex-col">
          <div className="relative flex h-32 items-center justify-center">
            <RingChart percent={data.uptimePercent} size={110} label="uptime" />
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="h-4 w-4 text-text-muted" />
            <h3 className="text-sm font-medium text-text-primary">Деплои ({data.deploys.length})</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{data.deploys.filter((d) => d.status === "success").length}</p>
              <p className="text-[10px] text-text-muted">Success</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-error">{failedDeploys.length}</p>
              <p className="text-[10px] text-text-muted">Failed</p>
            </div>
            <div className="flex-1 h-3 rounded-full bg-surface-hover overflow-hidden">
              <div className="h-full bg-success rounded-full"
                style={{ width: `${data.deploys.length > 0 ? (data.deploys.filter((d) => d.status === "success").length / data.deploys.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-text-muted" />
            <h3 className="text-sm font-medium text-text-primary">Инциденты</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{activeIncidents.length}</p>
              <p className="text-[10px] text-text-muted">Активных</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{data.incidents.filter((i) => i.status === "resolved").length}</p>
              <p className="text-[10px] text-text-muted">Resolved</p>
            </div>
            <div className="flex-1 space-y-1">
              {(["P1", "P2", "P3", "P4"] as const).map((sev) => {
                const count = data.incidents.filter((i) => i.severity === sev).length;
                return count > 0 ? (
                  <div key={sev} className="flex items-center gap-2 text-[10px]">
                    <span className="w-5 text-text-muted">{sev}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                      <div className={`h-full rounded-full ${sev === "P1" ? "bg-error" : sev === "P2" ? "bg-warning" : sev === "P3" ? "bg-primary" : "bg-text-muted"}`}
                        style={{ width: `${(count / data.incidents.length) * 100}%` }} />
                    </div>
                    <span className="text-text-muted w-3 text-right">{count}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Activity className="h-4 w-4 text-text-muted" />
          <h2 className="text-sm font-medium text-text-primary">Последние действия</h2>
        </div>
        <div className="divide-y divide-border">
          {data.auditLogs.map((log) => (
            <div key={log.id} className="flex flex-col gap-1 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-accent font-medium">{log.user.fullName || log.user.username}</span>
                <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-warning">{log.action}</span>
                <span className="truncate text-xs text-text-secondary max-w-[180px] sm:max-w-none">{log.target}</span>
              </div>
              <span className="text-[10px] text-text-muted shrink-0">{new Date(log.createdAt).toLocaleString("ru-RU")}</span>
            </div>
          ))}
          {data.auditLogs.length === 0 && (
            <p className="px-4 py-4 text-center text-xs text-text-muted">Нет действий</p>
          )}
        </div>
      </div>
    </div>
  );
}
