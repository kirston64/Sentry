export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string | null;
  assignee?: { id: string; username: string; fullName: string } | null;
  creator?: { id: string; username: string; fullName: string } | null;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  incidentId?: string;
}
