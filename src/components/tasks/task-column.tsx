"use client";

import { clsx } from "clsx";
import { Plus } from "lucide-react";
import { TaskCard } from "./task-card";
import type { Task, TaskStatus } from "@/types/task";

const columnConfig: Record<TaskStatus, { title: string; color: string }> = {
  todo: { title: "To Do", color: "text-text-secondary" },
  in_progress: { title: "In Progress", color: "text-warning" },
  done: { title: "Done", color: "text-success" },
};

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function TaskColumn({
  status,
  tasks,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onAddTask,
}: TaskColumnProps) {
  const config = columnConfig[status];

  return (
    <div
      className="flex flex-col rounded-lg border border-border bg-surface"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={clsx("text-xs font-medium", config.color)}>{config.title}</span>
          <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-text-muted">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="rounded p-0.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2" style={{ minHeight: "200px" }}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
}
