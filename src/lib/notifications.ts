import { getItem, setItem } from "@/lib/storage";
import type { Notification } from "@/types/notification";

const KEY = "sentry_notifications";

export function getNotifications(): Notification[] {
  return getItem<Notification[]>(KEY, []);
}

export function addNotification(n: Omit<Notification, "id" | "isRead" | "createdAt">) {
  const notifications = getNotifications();
  const newNotif: Notification = {
    ...n,
    id: `notif-${Date.now()}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  const updated = [newNotif, ...notifications].slice(0, 50);
  setItem(KEY, updated);
  return newNotif;
}

export function markAllRead() {
  const notifications = getNotifications().map((n) => ({ ...n, isRead: true }));
  setItem(KEY, notifications);
}

export function getUnreadCount(): number {
  return getNotifications().filter((n) => !n.isRead).length;
}
