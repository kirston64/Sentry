"use client";

import { useState, useEffect } from "react";
import { Activity, Filter } from "lucide-react";
import { useProfile } from "@/components/auth/profile-context";
import { canViewActivity } from "@/lib/rbac";
import { AccessDenied } from "@/components/auth/access-denied";

interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  target: string;
  details: string | null;
  createdAt: string;
  user: { username: string; fullName: string; role: string };
}

const actionColors: Record<string, string> = {
  deploy: "bg-accent/20 text-accent",
  incident: "bg-error/20 text-error",
  task: "bg-primary/20 text-primary",
  settings: "bg-warning/20 text-warning",
  console: "bg-text-muted/20 text-text-muted",
};

function getActionColor(action: string) {
  const prefix = action.split(".")[0];
  return actionColors[prefix] ?? "bg-surface-hover text-text-secondary";
}

export default function ActivityPage() {
  const profile = useProfile();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit").then(r => r.json()).then(setEntries).finally(() => setLoading(false));
  }, []);

  if (!canViewActivity(profile.role)) {
    return <AccessDenied message="Журнал действий доступен только для Admin и Owner." />;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        <div className="h-64 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  const actionTypes = [...new Set(entries.map((e) => e.action.split(".")[0]))];
  const filtered = actionFilter === "all" ? entries : entries.filter((e) => e.action.startsWith(actionFilter));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Audit Log</h1>
        <span className="ml-2 text-xs text-text-muted">{entries.length} записей</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <Filter className="h-3 w-3" />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setActionFilter("all")}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
              actionFilter === "all" ? "bg-surface-hover text-text-primary" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Все
          </button>
          {actionTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActionFilter(type)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                actionFilter === type ? "bg-surface-hover text-text-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">Время</th>
              <th className="px-4 py-3">Пользователь</th>
              <th className="px-4 py-3">Действие</th>
              <th className="px-4 py-3">Цель</th>
              <th className="px-4 py-3">Детали</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-text-muted">Нет записей</td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.id} className="transition-colors hover:bg-surface-hover">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-text-muted">
                    {new Date(entry.createdAt).toLocaleString("ru-RU")}
                  </td>
                  <td className="px-4 py-2.5 text-accent text-xs">{entry.user.fullName || entry.user.username}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${getActionColor(entry.action)}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-text-secondary">{entry.target}</td>
                  <td className="px-4 py-2.5 text-xs text-text-muted">{entry.details ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
