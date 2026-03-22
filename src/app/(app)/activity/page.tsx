import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canViewAuditLogs } from "@/lib/rbac";
import { Activity } from "lucide-react";

const MOCK_LOGS = [
  { id: "1", user: "owner", action: "settings.update", target: "server-config", time: "2026-03-22 14:30" },
  { id: "2", user: "admin", action: "project.add", target: "fivem-core", time: "2026-03-22 13:15" },
  { id: "3", user: "developer", action: "deploy.trigger", target: "server-02", time: "2026-03-22 12:00" },
  { id: "4", user: "admin", action: "user.role_change", target: "developer -> admin", time: "2026-03-22 10:45" },
  { id: "5", user: "owner", action: "repo.remove", target: "old-scripts", time: "2026-03-21 18:20" },
  { id: "6", user: "developer", action: "issue.create", target: "vehicle-sync#15", time: "2026-03-21 16:00" },
];

export default async function ActivityPage() {
  const profile = await getSession();
  if (!profile) redirect("/");

  if (!canViewAuditLogs(profile.role)) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-muted">
          Недостаточно прав для просмотра журнала действий. Требуется роль Admin или Owner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Audit Log</h1>
        <span className="ml-2 text-xs text-text-muted">{MOCK_LOGS.length} записей</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">Время</th>
              <th className="px-4 py-3">Пользователь</th>
              <th className="px-4 py-3">Действие</th>
              <th className="px-4 py-3">Цель</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MOCK_LOGS.map((log) => (
              <tr key={log.id} className="transition-colors hover:bg-surface-hover">
                <td className="whitespace-nowrap px-4 py-2.5 text-text-muted">{log.time}</td>
                <td className="px-4 py-2.5 text-accent">{log.user}</td>
                <td className="px-4 py-2.5 text-text-secondary">{log.action}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded bg-surface px-1.5 py-0.5 text-xs text-warning">{log.target}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
