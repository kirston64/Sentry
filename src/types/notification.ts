export type NotificationType =
  | "pr_merged"
  | "server_restart"
  | "deploy"
  | "task_update"
  | "member_joined"
  | "issue_created";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actorName?: string;
}
