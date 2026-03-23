import { getItem, setItem } from "@/lib/storage";
import { addNotification } from "@/lib/notifications";

const KEY = "sentry_audit_log";
const MAX_ENTRIES = 200;

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  target: string;
  details?: string;
  timestamp: string;
}

const SEED_ENTRIES: AuditEntry[] = [
  { id: "a1", user: "DarkSide", action: "deploy.trigger", target: "v2.14.0 → production", timestamp: "2026-03-22T14:00:00Z" },
  { id: "a2", user: "NightWolf", action: "deploy.trigger", target: "v2.13.2 → development", timestamp: "2026-03-22T12:30:00Z" },
  { id: "a3", user: "DarkSide", action: "incident.create", target: "Сервер #3 не запускается", details: "P2", timestamp: "2026-03-22T08:00:00Z" },
  { id: "a4", user: "PixelCraft", action: "task.move", target: "Новый UI инвентаря → in_progress", timestamp: "2026-03-22T11:00:00Z" },
  { id: "a5", user: "DarkSide", action: "settings.update", target: "server-config", timestamp: "2026-03-22T14:30:00Z" },
  { id: "a6", user: "NightWolf", action: "task.move", target: "Fix vehicle desync → in_progress", timestamp: "2026-03-22T09:00:00Z" },
  { id: "a7", user: "CodeViper", action: "deploy.trigger", target: "v2.12.4 → development", timestamp: "2026-03-21T11:00:00Z" },
  { id: "a8", user: "NetRunner", action: "incident.resolve", target: "Discord webhook не отправляет логи", timestamp: "2026-03-17T11:00:00Z" },
];

const SEEDED_KEY = "sentry_audit_seeded";

export function getAuditLog(): AuditEntry[] {
  const seeded = getItem<boolean>(SEEDED_KEY, false);
  if (!seeded) {
    setItem(KEY, SEED_ENTRIES);
    setItem(SEEDED_KEY, true);
    return SEED_ENTRIES;
  }
  return getItem<AuditEntry[]>(KEY, []);
}

const actionLabels: Record<string, string> = {
  "deploy.trigger": "Деплой запущен",
  "deploy.complete": "Деплой завершён",
  "incident.create": "Инцидент создан",
  "incident.resolve": "Инцидент разрешён",
  "incident.postmortem": "Postmortem написан",
  "task.create": "Задача создана",
  "task.move": "Задача перемещена",
  "task.delete": "Задача удалена",
  "settings.update": "Настройки обновлены",
  "console.command": "Команда в консоли",
};

export function addAuditEntry(entry: Omit<AuditEntry, "id" | "timestamp">) {
  const log = getAuditLog();
  const newEntry: AuditEntry = {
    ...entry,
    id: `a-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newEntry, ...log].slice(0, MAX_ENTRIES);
  setItem(KEY, updated);

  const label = actionLabels[entry.action] ?? entry.action;
  addNotification({
    type: entry.action.split(".")[0] === "deploy" ? "deploy"
      : entry.action.split(".")[0] === "incident" ? "issue_created"
      : "task_update",
    title: label,
    message: `${entry.user}: ${entry.target}${entry.details ? ` (${entry.details})` : ""}`,
    actorName: entry.user,
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sentry_audit"));
  }

  return newEntry;
}
