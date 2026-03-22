"use client";

import { useState, useCallback, useRef } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { TaskColumn } from "./task-column";
import { TaskModal } from "./task-modal";
import { SEED_TASKS } from "@/lib/mock-data";
import type { Task, TaskStatus } from "@/types/task";

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

export function KanbanBoard() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("sentry_tasks", SEED_TASKS);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const draggedId = useRef<string | null>(null);

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
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
        )
      );
      draggedId.current = null;
    },
    [setTasks]
  );

  const handleSave = useCallback(
    (task: Task) => {
      setTasks((prev) => {
        const exists = prev.find((t) => t.id === task.id);
        if (exists) return prev.map((t) => (t.id === task.id ? task : t));
        return [...prev, task];
      });
      setModalOpen(false);
      setEditingTask(null);
    },
    [setTasks]
  );

  const handleDelete = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setModalOpen(false);
      setEditingTask(null);
    },
    [setTasks]
  );

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
            tasks={tasks.filter((t) => t.status === status)}
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
          onDelete={handleDelete}
          onClose={() => {
            setModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}
    </>
  );
}
