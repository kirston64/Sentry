"use client";

import { StatCard } from "@/components/ui/stat-card";
import { ServerStatusWidget } from "@/components/dashboard/server-status-widget";
import { QuickActions } from "@/components/dashboard/quick-actions";
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
  TrendingUp,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  SERVERS,
  TEAM_MEMBERS,
  PLAYER_HISTORY_24H,
  COMMIT_ACTIVITY_7D,
  UPTIME_PERCENT,
  DEPLOYS,
  SEED_INCIDENTS,
} from "@/lib/mock-data";
import type { Incident } from "@/types/incident";
import Link from "next/link";

const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const onlineServers = SERVERS.filter((s) => s.status === "online").length;
const onlineMembers = TEAM_MEMBERS.filter((m) => m.isOnline).length;

const RECENT_LOGS = [
  { user: "DarkSide", action: "Обновил конфиг сервера", target: "server-01", time: "2м назад" },
  { user: "NightWolf", action: "Принял PR #42", target: "fivem-core", time: "15м назад" },
  { user: "PixelCraft", action: "Создала Issue", target: "vehicle-sync", time: "1ч назад" },
  { user: "DarkSide", action: "Деплой на прод", target: "server-02", time: "3ч назад" },
  { user: "ShadowLua", action: "Пуш в main", target: "inventory-system", time: "5ч назад" },
];

export default function DashboardPage() {
  const [incidents] = useLocalStorage<Incident[]>("sentry_incidents", SEED_INCIDENTS);

  const offlineServers = SERVERS.filter((s) => s.status === "offline");
  const failedDeploys = DEPLOYS.filter((d) => d.status === "failed");
  const activeIncidents = incidents.filter((i) => i.status !== "resolved");
  const hasProblems = offlineServers.length > 0 || failedDeploys.length > 0 || activeIncidents.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <span className="text-xs text-text-muted">GTA 5 RP Dev-Ops</span>
      </div>

      {/* Alert banner */}
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

      {/* Server status strip */}
      <ServerStatusWidget />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Серверы онлайн"
          value={`${onlineServers} / ${SERVERS.length}`}
          icon={Server}
          color="success"
          href="/servers"
          trend={{ value: "100%", direction: "up" }}
        />
        <StatCard
          title="Open Issues"
          value={12}
          icon={AlertCircle}
          color="warning"
          href="/repositories"
          trend={{ value: "+3", direction: "up" }}
        />
        <StatCard
          title="Pull Requests"
          value={5}
          icon={GitPullRequest}
          color="primary"
          href="/repositories"
          trend={{ value: "-2", direction: "down" }}
        />
        <StatCard
          title="Команда онлайн"
          value={`${onlineMembers} / ${TEAM_MEMBERS.length}`}
          icon={Users}
          color="accent"
          href="/team"
        />
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ChartCard title="Игроки за 24ч">
          <div className="h-32">
            <LineChart
              data={PLAYER_HISTORY_24H}
              color="#007fd4"
              labels={HOURS.filter((_, i) => i % 6 === 0)}
            />
          </div>
        </ChartCard>
        <ChartCard title="Коммиты за неделю">
          <div className="h-32">
            <BarChart data={COMMIT_ACTIVITY_7D} color="#4ec9b0" />
          </div>
        </ChartCard>
        <ChartCard title="Uptime" className="flex flex-col">
          <div className="relative flex h-32 items-center justify-center">
            <RingChart percent={UPTIME_PERCENT} size={110} label="uptime" />
          </div>
        </ChartCard>
      </div>

      {/* Extra stats row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="h-4 w-4 text-text-muted" />
            <h3 className="text-sm font-medium text-text-primary">Деплои (последние {DEPLOYS.length})</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{DEPLOYS.filter((d) => d.status === "success").length}</p>
              <p className="text-[10px] text-text-muted">Success</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-error">{failedDeploys.length}</p>
              <p className="text-[10px] text-text-muted">Failed</p>
            </div>
            <div className="flex-1 h-3 rounded-full bg-surface-hover overflow-hidden">
              <div
                className="h-full bg-success rounded-full"
                style={{ width: `${(DEPLOYS.filter((d) => d.status === "success").length / DEPLOYS.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-text-muted">
              {Math.round((DEPLOYS.filter((d) => d.status === "success").length / DEPLOYS.length) * 100)}%
            </span>
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
              <p className="text-2xl font-bold text-success">{incidents.filter((i) => i.status === "resolved").length}</p>
              <p className="text-[10px] text-text-muted">Resolved</p>
            </div>
            <div className="flex-1 space-y-1">
              {(["P1", "P2", "P3", "P4"] as const).map((sev) => {
                const count = incidents.filter((i) => i.severity === sev).length;
                return count > 0 ? (
                  <div key={sev} className="flex items-center gap-2 text-[10px]">
                    <span className="w-5 text-text-muted">{sev}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-surface-hover overflow-hidden">
                      <div
                        className={`h-full rounded-full ${sev === "P1" ? "bg-error" : sev === "P2" ? "bg-warning" : sev === "P3" ? "bg-primary" : "bg-text-muted"}`}
                        style={{ width: `${(count / incidents.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-text-muted w-3 text-right">{count}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Activity className="h-4 w-4 text-text-muted" />
          <h2 className="text-sm font-medium text-text-primary">Последние действия</h2>
        </div>
        <div className="divide-y divide-border">
          {RECENT_LOGS.map((log, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-accent">{log.user}</span>
                <span className="text-text-secondary">{log.action}</span>
                <span className="rounded bg-surface-hover px-1.5 py-0.5 text-xs text-warning">
                  {log.target}
                </span>
              </div>
              <span className="text-xs text-text-muted">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
