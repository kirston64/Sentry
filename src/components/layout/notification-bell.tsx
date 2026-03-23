"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { getNotifications, markAllRead, getUnreadCount } from "@/lib/notifications";
import type { Notification } from "@/types/notification";

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
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setNotifications(getNotifications());
    setUnread(getUnreadCount());

    const handler = () => {
      setNotifications(getNotifications());
      setUnread(getUnreadCount());
    };
    window.addEventListener("sentry_audit", handler);
    return () => window.removeEventListener("sentry_audit", handler);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) {
      markAllRead();
      setUnread(0);
      setNotifications(getNotifications().map((n) => ({ ...n, isRead: true })));
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
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-2 border-b border-border px-3 py-2 last:border-0"
                  >
                    <span className="mt-0.5 shrink-0 rounded bg-primary/20 px-1 py-0.5 text-[9px] font-bold text-primary">
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
