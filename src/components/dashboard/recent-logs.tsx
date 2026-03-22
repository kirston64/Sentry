import type { AuditLog } from "@/types/database";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins}м назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ч назад`;
  const days = Math.floor(hours / 24);
  return `${days}д назад`;
}

export function RecentLogs({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-text-muted">
        Нет записей
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-center justify-between px-4 py-2.5 text-sm"
        >
          <div className="flex items-center gap-3">
            <span className="text-accent">
              {log.profile?.github_username ?? "system"}
            </span>
            <span className="text-text-secondary">{log.action}</span>
            {log.target && (
              <span className="rounded bg-surface-hover px-1.5 py-0.5 text-xs text-warning">
                {log.target}
              </span>
            )}
          </div>
          <span className="text-xs text-text-muted">
            {timeAgo(log.created_at)}
          </span>
        </div>
      ))}
    </div>
  );
}
