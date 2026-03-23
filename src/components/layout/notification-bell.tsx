"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "сейчас";
  if (mins < 60) return `${mins}м`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}ч`;
  return `${Math.floor(hours / 24)}д`;
}

const typeEmoji: Record<string, string> = {
  pr_merged: "PR",
  server_restart: "SRV",
  deploy: "DEP",
  task_update: "TSK",
  member_joined: "NEW",
  issue_created: "ISS",
  password_expiry: "PWD",
  device_login: "DEV",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unread, setUnread] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnread(data.filter((n: NotificationData) => !n.isRead).length);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleOpen = async () => {
    setOpen(!open);
    if (!open && unread > 0) {
      await fetch("/api/notifications", { method: "PATCH" });
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-lg border border-border bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs font-medium text-text-primary">Уведомления</span>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-text-muted">Нет уведомлений</p>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2 border-b border-border px-3 py-2 last:border-0 ${
                      !n.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <span className={`mt-0.5 shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ${
                      n.type === "device_login" ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"
                    }`}>
                      {typeEmoji[n.type] ?? "SYS"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-text-primary">{n.title}</p>
                      <p className="truncate text-[10px] text-text-muted">{n.message}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-text-muted">{timeAgo(n.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
