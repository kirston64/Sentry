"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { TaskColumn } from "./task-column";
import { TaskModal } from "./task-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SEED_TASKS } from "@/lib/mock-data";
import { addAuditEntry } from "@/lib/audit";
import type { Task, TaskStatus, TaskPriority } from "@/types/task";

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

interface KanbanBoardProps {
  priorityFilter?: TaskPriority | "all";
  assigneeFilter?: string;
}

export function KanbanBoard({ priorityFilter = "all", assigneeFilter = "all" }: KanbanBoardProps) {
  const [tasks, setTasks] = useLocalStorage<Task[]>("sentry_tasks", SEED_TASKS);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const draggedId = useRef<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (assigneeFilter === "unassigned" && t.assigneeId !== null) return false;
      if (assigneeFilter !== "all" && assigneeFilter !== "unassigned" && t.assigneeId !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, priorityFilter, assigneeFilter]);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    draggedId.current = taskId;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, status: TaskStatus) => {
      e.preventDefault();
      const id = draggedId.current;
      if (!id) return;
      const task = tasks.find((t) => t.id === id);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
        )
      );
      if (task) {
        addAuditEntry({ user: "You", action: "task.move", target: `${task.title} → ${status}` });
      }
      draggedId.current = null;
    },
    [setTasks]
  );

  const handleSave = useCallback(
    (task: Task) => {
      setTasks((prev) => {
        const exists = prev.find((t) => t.id === task.id);
        if (!exists) {
          addAuditEntry({ user: "You", action: "task.create", target: task.title, details: task.priority });
        }
        if (exists) return prev.map((t) => (t.id === task.id ? task : t));
        return [...prev, task];
      });
      setModalOpen(false);
      setEditingTask(null);
    },
    [setTasks]
  );

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteConfirm(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirm) return;
    const task = tasks.find((t) => t.id === deleteConfirm);
    setTasks((prev) => prev.filter((t) => t.id !== deleteConfirm));
    if (task) {
      addAuditEntry({ user: "You", action: "task.delete", target: task.title });
    }
    setDeleteConfirm(null);
    setModalOpen(false);
    setEditingTask(null);
  }, [deleteConfirm, tasks, setTasks]);

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  }, []);

  const handleAddTask = useCallback((status: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={filteredTasks.filter((t) => t.status === status)}
            onEdit={handleEdit}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onAddTask={handleAddTask}
          />
        ))}
      </div>

      {modalOpen && (
        <TaskModal
          task={editingTask}
          defaultStatus={defaultStatus}
          onSave={handleSave}
          onDelete={handleDeleteRequest}
          onClose={() => {
            setModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Удалить задачу?"
          message={`Задача "${tasks.find((t) => t.id === deleteConfirm)?.title}" будет удалена без возможности восстановления.`}
          confirmLabel="Удалить"
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </>
  );
}
