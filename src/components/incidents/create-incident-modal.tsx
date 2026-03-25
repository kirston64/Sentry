"use client";

import { useState, useEffect } from "react";
import { X, Lock } from "lucide-react";
import { useProfile } from "@/components/auth/profile-context";
import { canCreateIncident } from "@/lib/rbac";
import type { Severity } from "@/types/incident";

interface CreateIncidentModalProps {
  onSave: () => void;
  onClose: () => void;
}

interface UserOption { id: string; username: string; fullName: string }

export function CreateIncidentModal({ onSave, onClose }: CreateIncidentModalProps) {
  const profile = useProfile();
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("P3");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [saving, setSaving] = useState(false);

  const canCreate = canCreateIncident(profile.role, severity);

  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(setUsers);
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !canCreate) return;
    setSaving(true);

    const res = await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        severity,
        assigneeId: assigneeId || null,
        description: description.trim(),
      }),
    });

    if (res.ok) {
      onSave();
    }
    setSaving(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[90vh] rounded-lg border border-border bg-surface p-5 shadow-xl animate-fade-in">
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
                <option value="P1" disabled={!canCreateIncident(profile.role, "P1")}>P1 — Critical</option>
                <option value="P2" disabled={!canCreateIncident(profile.role, "P2")}>P2 — High</option>
                <option value="P3">P3 — Medium</option>
                <option value="P4">P4 — Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] text-text-muted">Ответственный</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
              >
                <option value="">Не назначен</option>
                {users.map((m) => (
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
            disabled={!title.trim() || !canCreate || saving}
            className="rounded bg-error px-4 py-1.5 text-xs font-medium text-white hover:bg-error/80 disabled:opacity-50 flex items-center gap-1.5"
          >
            {!canCreate && <Lock className="h-3 w-3" />}
            {saving ? "Создание..." : canCreate ? "Создать инцидент" : "Нет доступа"}
          </button>
        </div>
      </div>
    </>
  );
}
