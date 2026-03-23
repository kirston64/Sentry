"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Filter } from "lucide-react";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import type { TaskPriority } from "@/types/task";

interface UserOption { id: string; username: string; fullName: string }

export default function TasksPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [taskCounts, setTaskCounts] = useState({ total: 0, active: 0 });
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then((data) => {
      setUsers(data.map((u: { id: string; username: string; fullName: string }) => ({ id: u.id, username: u.username, fullName: u.fullName })));
    });
    fetch("/api/tasks").then(r => r.json()).then((tasks) => {
      setTaskCounts({ total: tasks.length, active: tasks.filter((t: { status: string }) => t.status !== "done").length });
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Tasks</h1>
        <span className="ml-2 text-xs text-text-muted">{taskCounts.active} активных / {taskCounts.total} всего</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <Filter className="h-3 w-3" />
          Фильтры:
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "all")}
          className="rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary"
        >
          <option value="all">Все приоритеты</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary"
        >
          <option value="all">Все исполнители</option>
          <option value="unassigned">Не назначен</option>
          {users.map((m) => (
            <option key={m.id} value={m.id}>{m.username}</option>
          ))}
        </select>
        {(priorityFilter !== "all" || assigneeFilter !== "all") && (
          <button
            onClick={() => { setPriorityFilter("all"); setAssigneeFilter("all"); }}
            className="text-[10px] text-primary hover:underline"
          >
            Сбросить
          </button>
        )}
      </div>

      <KanbanBoard priorityFilter={priorityFilter} assigneeFilter={assigneeFilter} />
    </div>
  );
}
