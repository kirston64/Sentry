"use client";

import { clsx } from "clsx";
import { GripVertical } from "lucide-react";
import { TEAM_MEMBERS } from "@/lib/mock-data";
import type { Task } from "@/types/task";

const priorityConfig = {
  low: { label: "Low", color: "bg-text-muted/20 text-text-muted" },
  medium: { label: "Med", color: "bg-primary/20 text-primary" },
  high: { label: "High", color: "bg-warning/20 text-warning" },
  critical: { label: "Crit", color: "bg-error/20 text-error" },
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export function TaskCard({ task, onEdit, onDragStart }: TaskCardProps) {
  const assignee = TEAM_MEMBERS.find((m) => m.id === task.assigneeId);
  const p = priorityConfig[task.priority];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onEdit(task)}
      className="cursor-pointer rounded-md border border-border bg-background p-3 transition-all hover:border-border-focus hover:scale-[1.01] active:scale-[0.98] active:opacity-70"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-grab text-text-muted" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-primary leading-snug">{task.title}</p>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className={clsx("rounded px-1.5 py-0.5 text-[9px] font-medium", p.color)}>
              {p.label}
            </span>
            {task.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded bg-surface-hover px-1.5 py-0.5 text-[9px] text-text-muted">
                {tag}
              </span>
            ))}
          </div>
          {assignee && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[8px] font-bold text-primary">
                {assignee.username[0]}
              </div>
              <span className="text-[10px] text-text-muted">{assignee.username}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
