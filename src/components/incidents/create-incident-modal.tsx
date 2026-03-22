"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { TEAM_MEMBERS } from "@/lib/mock-data";
import type { Incident, Severity } from "@/types/incident";

interface CreateIncidentModalProps {
  onSave: (incident: Incident) => void;
  onClose: () => void;
}

export function CreateIncidentModal({ onSave, onClose }: CreateIncidentModalProps) {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("P2");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  const handleSave = () => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    onSave({
      id: `inc-${Date.now()}`,
      title: title.trim(),
      severity,
      status: "investigating",
      assigneeId,
      createdAt: now,
      resolvedAt: null,
      timeline: [
        { timestamp: now, message: description.trim() || "Инцидент создан", author: "You" },
      ],
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-text-primary">Новый инцидент</h3>
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
              placeholder="Что произошло?"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] text-text-muted">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
              >
                <option value="P1">P1 — Critical</option>
                <option value="P2">P2 — High</option>
                <option value="P3">P3 — Medium</option>
                <option value="P4">P4 — Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-text-muted">Ответственный</label>
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
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded px-3 py-1.5 text-xs text-text-muted hover:text-text-primary">
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="rounded bg-error px-4 py-1.5 text-xs font-medium text-white hover:bg-error/80 disabled:opacity-50"
          >
            Создать инцидент
          </button>
        </div>
      </div>
    </>
  );
}
