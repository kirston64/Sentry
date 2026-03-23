"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { TaskColumn } from "./task-column";
import { TaskModal } from "./task-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Task, TaskStatus, TaskPriority } from "@/types/task";

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

interface KanbanBoardProps {
  priorityFilter?: TaskPriority | "all";
  assigneeFilter?: string;
}

export function KanbanBoard({ priorityFilter = "all", assigneeFilter = "all" }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const draggedId = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/tasks").then(r => r.json()).then(setTasks);
  }, []);

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
    async (e: React.DragEvent, status: TaskStatus) => {
      e.preventDefault();
      const id = draggedId.current;
      if (!id) return;

      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));

      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      draggedId.current = null;
    },
    []
  );

  const handleSave = useCallback(
    async (task: Task) => {
      const exists = tasks.find((t) => t.id === task.id);
      if (exists) {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(task),
        });
        if (res.ok) {
          const updated = await res.json();
          setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
        }
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(task),
        });
        if (res.ok) {
          const created = await res.json();
          setTasks((prev) => [...prev, created]);
        }
      }
      setModalOpen(false);
      setEditingTask(null);
    },
    [tasks]
  );

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteConfirm(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    await fetch(`/api/tasks/${deleteConfirm}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== deleteConfirm));
    setDeleteConfirm(null);
    setModalOpen(false);
    setEditingTask(null);
  }, [deleteConfirm]);

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
