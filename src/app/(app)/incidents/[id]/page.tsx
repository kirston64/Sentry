"use client";

import { use, useState, useEffect } from "react";
import { clsx } from "clsx";
import { AlertTriangle, FileText, Save, Edit3, Bot, Loader2 } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { IncidentTimeline } from "@/components/incidents/incident-timeline";
import { useProfile } from "@/components/auth/profile-context";
import type { Incident, Postmortem } from "@/types/incident";

const severityConfig = {
  P1: { color: "bg-error/20 text-error border-error/30", label: "P1 Critical" },
  P2: { color: "bg-warning/20 text-warning border-warning/30", label: "P2 High" },
  P3: { color: "bg-primary/20 text-primary border-primary/30", label: "P3 Medium" },
  P4: { color: "bg-text-muted/20 text-text-muted border-text-muted/30", label: "P4 Low" },
};

const statusConfig = {
  investigating: { color: "text-error", label: "Investigating" },
  identified: { color: "text-warning", label: "Identified" },
  monitoring: { color: "text-primary", label: "Monitoring" },
  resolved: { color: "text-success", label: "Resolved" },
};

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const profile = useProfile();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPostmortem, setEditingPostmortem] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [pmForm, setPmForm] = useState<Postmortem>({
    whatBroke: "", rootCause: "", fix: "", prevention: "",
    author: profile.github_username ?? "Unknown", writtenAt: new Date().toISOString(),
  });

  useEffect(() => {
    fetch(`/api/incidents/${id}`)
      .then((r) => r.json())
      .then((data) => {
        // Transform timeline author from relation object to string
        if (data.timeline) {
          data.timeline = data.timeline.map((e: { timestamp?: string; createdAt?: string; message: string; author?: { username: string } | string }) => ({
            timestamp: e.timestamp || e.createdAt,
            message: e.message,
            author: typeof e.author === "object" && e.author ? e.author.username : (e.author ?? "system"),
          }));
        }
        // Transform postmortem to match frontend Postmortem type
        if (data.postmortem) {
          const pm = data.postmortem;
          data.postmortem = {
            whatBroke: pm.whatBroke,
            rootCause: pm.rootCause,
            fix: pm.fix,
            prevention: pm.prevention,
            author: pm.author?.username ?? data.creator?.username ?? "Unknown",
            writtenAt: pm.writtenAt ?? pm.createdAt ?? pm.updatedAt,
          };
        }
        setIncident(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-muted animate-pulse">Загрузка...</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-muted">Инцидент не найден</p>
      </div>
    );
  }

  const sev = severityConfig[incident.severity];
  const st = statusConfig[incident.status];
  const assignee = incident.assignee;

  const durationMs = incident.resolvedAt
    ? new Date(incident.resolvedAt).getTime() - new Date(incident.createdAt).getTime()
    : Date.now() - new Date(incident.createdAt).getTime();
  const durationHours = Math.floor(durationMs / 3600000);
  const durationMins = Math.floor((durationMs % 3600000) / 60000);

  const savePostmortem = async (postmortem: Postmortem) => {
    const res = await fetch(`/api/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postmortem }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIncident(updated);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Incidents", href: "/incidents" },
        { label: incident.title },
      ]} />

      {/* Header */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className={clsx("h-6 w-6 mt-0.5", sev.color.includes("error") ? "text-error" : sev.color.includes("warning") ? "text-warning" : "text-primary")} />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-text-primary">{incident.title}</h1>
              <span className={clsx("rounded border px-2 py-0.5 text-[10px] font-bold", sev.color)}>
                {sev.label}
              </span>
              <span className={clsx("text-xs font-medium", st.color)}>
                {st.label}
              </span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div>
                <span className="text-text-muted">Создан</span>
                <p className="text-text-secondary">{new Date(incident.createdAt).toLocaleString("ru-RU")}</p>
              </div>
              <div>
                <span className="text-text-muted">Длительность</span>
                <p className="text-text-secondary">
                  {durationHours > 0 ? `${durationHours}ч ` : ""}{durationMins}м
                  {!incident.resolvedAt && " (ongoing)"}
                </p>
              </div>
              <div>
                <span className="text-text-muted">Ответственный</span>
                <p className="text-accent">{assignee?.username ?? "Не назначен"}</p>
              </div>
              <div>
                <span className="text-text-muted">Resolved</span>
                <p className="text-text-secondary">
                  {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString("ru-RU") : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-text-primary">AI-анализ инцидента</h2>
          </div>
          <button
            onClick={async () => {
              setAiLoading(true);
              setAiAnalysis(null);
              try {
                const res = await fetch(`/api/incidents/${id}/ai-analyze`, { method: "POST" });
                const data = await res.json();
                setAiAnalysis(data.analysis ?? data.error ?? "Нет ответа");
              } catch {
                setAiAnalysis("Ошибка при запросе AI");
              } finally {
                setAiLoading(false);
              }
            }}
            disabled={aiLoading}
            className="flex items-center gap-1.5 rounded bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bot className="h-3 w-3" />}
            {aiLoading ? "Анализирую..." : "Проанализировать"}
          </button>
        </div>
        {aiAnalysis && (
          <div className="rounded border border-primary/20 bg-primary/5 p-4 text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">
            {aiAnalysis}
          </div>
        )}
        {!aiAnalysis && !aiLoading && (
          <p className="text-xs text-text-muted">AI проанализирует timeline событий и последние логи серверов, чтобы найти корневую причину и предложить решения.</p>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-text-primary">Таймлайн расследования</h2>
        <IncidentTimeline events={incident.timeline} />
      </div>

      {/* Postmortem */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-medium text-text-primary">Postmortem</h2>
          </div>
          {incident.postmortem && !editingPostmortem && (
            <button
              onClick={() => {
                setPmForm(incident.postmortem!);
                setEditingPostmortem(true);
              }}
              className="flex items-center gap-1 text-[10px] text-primary hover:underline"
            >
              <Edit3 className="h-3 w-3" /> Редактировать
            </button>
          )}
        </div>

        {incident.postmortem && !editingPostmortem ? (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-medium text-error mb-1">Что сломалось</p>
              <p className="text-xs text-text-secondary leading-relaxed">{incident.postmortem.whatBroke}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-warning mb-1">Корневая причина</p>
              <p className="text-xs text-text-secondary leading-relaxed">{incident.postmortem.rootCause}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-success mb-1">Как починили</p>
              <p className="text-xs text-text-secondary leading-relaxed">{incident.postmortem.fix}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-primary mb-1">Предотвращение</p>
              <p className="text-xs text-text-secondary leading-relaxed">{incident.postmortem.prevention}</p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-border text-[10px] text-text-muted">
              <span>Автор: <span className="text-accent">{incident.postmortem.author}</span></span>
              <span>{new Date(incident.postmortem.writtenAt).toLocaleString("ru-RU")}</span>
            </div>
          </div>
        ) : editingPostmortem || !incident.postmortem ? (
          <div className="space-y-3">
            {[
              { key: "whatBroke" as const, label: "Что сломалось", placeholder: "Опишите что именно перестало работать..." },
              { key: "rootCause" as const, label: "Корневая причина", placeholder: "Почему это произошло..." },
              { key: "fix" as const, label: "Как починили", placeholder: "Что было сделано для исправления..." },
              { key: "prevention" as const, label: "Предотвращение", placeholder: "Что сделать чтобы не повторилось..." },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] font-medium text-text-muted mb-1 block">{label}</label>
                <textarea
                  value={pmForm[key]}
                  onChange={(e) => setPmForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  rows={2}
                  className="w-full rounded border border-border bg-bg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted/50 focus:border-primary focus:outline-none resize-none"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const postmortem: Postmortem = {
                    ...pmForm,
                    author: profile.github_username ?? "Unknown",
                    writtenAt: new Date().toISOString(),
                  };
                  savePostmortem(postmortem);
                  setEditingPostmortem(false);
                }}
                disabled={!pmForm.whatBroke || !pmForm.rootCause || !pmForm.fix || !pmForm.prevention}
                className="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="h-3 w-3" /> Сохранить
              </button>
              {editingPostmortem && (
                <button
                  onClick={() => setEditingPostmortem(false)}
                  className="rounded px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
                >
                  Отмена
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
