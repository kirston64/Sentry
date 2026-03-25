"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Filter, FileDown } from "lucide-react";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { downloadCSV } from "@/lib/export";
import type { TaskPriority } from "@/types/task";

interface UserOption { id: string; username: string; fullName: string }

export default function TasksPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [taskCounts, setTaskCounts] = useState({ total: 0, active: 0 });
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then((data) => {
      setUsers(data.map((u: { id: string; username: string; fullName: string }) => ({ id: u.id, username: u.username, fullName: u.fullName })));
    });
    fetch("/api/tasks").then(r => r.json()).then((tasks) => {
      setTaskCounts({ total: tasks.length, active: tasks.filter((t: { status: string }) => t.status !== "done").length });
    });
  }, []);

  const handleExportCSV = async () => {
    const res = await fetch("/api/tasks");
    if (!res.ok) return;
    const tasks = await res.json();
    downloadCSV(
      tasks.map((t: { id: string; title: string; status: string; priority: string; assignee?: { fullName?: string; username?: string } | null; createdAt: string }) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee ? (t.assignee.fullName || t.assignee.username || "") : "",
        createdAt: t.createdAt,
      })),
      `tasks-${new Date().toISOString().slice(0, 10)}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Tasks</h1>
        <span className="ml-2 text-xs text-text-muted">{taskCounts.active} активных / {taskCounts.total} всего</span>
        <button
          onClick={handleExportCSV}
          className="ml-auto flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
          title="Экспорт CSV"
        >
          <FileDown className="h-3.5 w-3.5" />
          CSV
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <Filter className="h-3 w-3" />
          Фильтры:
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary"
              title="С даты"
            />
            <span className="text-xs text-text-muted">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary"
              title="По дату"
            />
          </div>
          {(priorityFilter !== "all" || assigneeFilter !== "all" || dateFrom || dateTo) && (
            <button
              onClick={() => { setPriorityFilter("all"); setAssigneeFilter("all"); setDateFrom(""); setDateTo(""); }}
              className="text-[10px] text-primary hover:underline"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      <KanbanBoard priorityFilter={priorityFilter} assigneeFilter={assigneeFilter} dateFrom={dateFrom} dateTo={dateTo} />
    </div>
  );
}
