"use client";

import { useState } from "react";
import { X, Sparkles, Loader2, Check, AlertCircle } from "lucide-react";

interface ParsedTask {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
}

interface ImportTasksModalProps {
  onClose: () => void;
  onImported: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-error/20 text-error border-error/30",
  high: "bg-warning/20 text-warning border-warning/30",
  medium: "bg-primary/20 text-primary border-primary/30",
  low: "bg-text-muted/20 text-text-muted border-text-muted/30",
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function ImportTasksModal({ onClose, onImported }: ImportTasksModalProps) {
  const [text, setText] = useState("");
  const [tasks, setTasks] = useState<ParsedTask[]>([]);
  const [step, setStep] = useState<"input" | "preview">("input");
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    setError("");

    const res = await fetch("/api/tasks/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    setParsing(false);

    if (!res.ok || !data.tasks) {
      setError(data.error || "Ошибка парсинга");
      return;
    }

    setTasks(data.tasks);
    setStep("preview");
  };

  const handleCreateAll = async () => {
    setCreating(true);
    await Promise.all(
      tasks.map((t) =>
        fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: t.title, description: t.description, priority: t.priority }),
        })
      )
    );
    setCreating(false);
    onImported();
    onClose();
  };

  const removeTask = (i: number) => setTasks((prev) => prev.filter((_, idx) => idx !== i));

  const updatePriority = (i: number, priority: ParsedTask["priority"]) =>
    setTasks((prev) => prev.map((t, idx) => (idx === i ? { ...t, priority } : t)));

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[90vh] rounded-lg border border-border bg-surface shadow-xl animate-fade-in">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium text-text-primary">Импорт задач из текста</h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {step === "input" ? (
            <>
              <p className="text-xs text-text-muted">
                Вставь любой текст — список задач, заметки с митинга, сообщение из чата. Gemini сам разберёт и создаст задачи с приоритетами.
              </p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                autoFocus
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-border-focus resize-none placeholder-text-muted"
                placeholder={"— починить баг с авторизацией срочно\n— обновить карту сервера\n— добавить новый скин для полиции (низкий приоритет)\nнадо разобраться с утечкой памяти на main сервере, это критично"}
              />
              {error && (
                <div className="flex items-center gap-2 rounded border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="rounded px-3 py-1.5 text-xs text-text-muted hover:text-text-primary">
                  Отмена
                </button>
                <button
                  onClick={handleParse}
                  disabled={!text.trim() || parsing}
                  className="flex items-center gap-1.5 rounded bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {parsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {parsing ? "Анализирую..." : "Разобрать"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-text-muted">
                Найдено <span className="text-text-primary font-medium">{tasks.length}</span> задач. Можешь изменить приоритет или удалить лишнее перед созданием.
              </p>
              <div className="space-y-2">
                {tasks.map((task, i) => (
                  <div key={i} className="rounded border border-border bg-background p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-text-primary leading-snug">{task.title}</p>
                      <button onClick={() => removeTask(i)} className="shrink-0 text-text-muted hover:text-error transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-[11px] text-text-muted">{task.description}</p>
                    )}
                    <div className="flex gap-1">
                      {(["critical", "high", "medium", "low"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => updatePriority(i, p)}
                          className={`rounded border px-2 py-0.5 text-[10px] transition-colors ${
                            task.priority === p
                              ? PRIORITY_COLORS[p]
                              : "border-border text-text-muted hover:text-text-secondary"
                          }`}
                        >
                          {PRIORITY_LABELS[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {tasks.length === 0 && (
                <p className="text-center text-xs text-text-muted py-4">Все задачи удалены</p>
              )}
              <div className="flex justify-between gap-2 pt-1">
                <button
                  onClick={() => { setStep("input"); setError(""); }}
                  className="text-xs text-text-muted hover:text-text-primary"
                >
                  Назад
                </button>
                <button
                  onClick={handleCreateAll}
                  disabled={tasks.length === 0 || creating}
                  className="flex items-center gap-1.5 rounded bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {creating ? "Создаю..." : `Создать ${tasks.length} задач`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
