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
} from "lucide-react";
import {
  SERVERS,
  TEAM_MEMBERS,
  PLAYER_HISTORY_24H,
  COMMIT_ACTIVITY_7D,
  UPTIME_PERCENT,
} from "@/lib/mock-data";

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
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>
        <span className="text-xs text-text-muted">GTA 5 RP Dev-Ops</span>
      </div>

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
