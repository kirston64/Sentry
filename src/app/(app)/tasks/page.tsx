"use client";

import { CheckSquare } from "lucide-react";
import { KanbanBoard } from "@/components/tasks/kanban-board";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Tasks</h1>
        <span className="ml-2 text-xs text-text-muted">Kanban Board</span>
      </div>

      <KanbanBoard />
    </div>
  );
}
