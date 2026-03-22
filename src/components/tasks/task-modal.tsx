"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { TEAM_MEMBERS } from "@/lib/mock-data";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";

interface TaskModalProps {
  task: Task | null;
  defaultStatus?: TaskStatus;
  onSave: (task: Task) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function TaskModal({ task, defaultStatus = "todo", onSave, onDelete, onClose }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setAssigneeId(task.assigneeId);
      setPriority(task.priority);
      setTags(task.tags.join(", "));
    }
  }, [task]);

  const handleSave = () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    onSave({
      id: task?.id ?? `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      assigneeId,
      priority,
      status: task?.status ?? defaultStatus,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      createdAt: task?.createdAt ?? now,
      updatedAt: now,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-primary">
            {task ? "Редактировать задачу" : "Новая задача"}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[10px] text-text-muted">Название</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
              placeholder="Что нужно сделать?"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] text-text-muted">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-border-focus resize-none"
              placeholder="Подробности..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] text-text-muted">Исполнитель</label>
              <select
                value={assigneeId ?? ""}
                onChange={(e) => setAssigneeId(e.target.value || null)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
              >
                <option value="">Не назначен</option>
                {TEAM_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id}>{m.username}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] text-text-muted">Приоритет</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] text-text-muted">Теги (через запятую)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
              placeholder="bug, feature, ui"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {task && onDelete ? (
            <button
              onClick={() => onDelete(task.id)}
              className="text-xs text-error hover:underline"
            >
              Удалить
            </button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="rounded bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {task ? "Сохранить" : "Создать"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
