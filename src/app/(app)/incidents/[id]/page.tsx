"use client";

import { use } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { ArrowLeft, AlertTriangle, Clock, User } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { IncidentTimeline } from "@/components/incidents/incident-timeline";
import { SEED_INCIDENTS, TEAM_MEMBERS } from "@/lib/mock-data";
import type { Incident } from "@/types/incident";

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
  const [incidents] = useLocalStorage<Incident[]>("sentry_incidents", SEED_INCIDENTS);
  const incident = incidents.find((i) => i.id === id);

  if (!incident) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-muted">Инцидент не найден</p>
      </div>
    );
  }

  const sev = severityConfig[incident.severity];
  const st = statusConfig[incident.status];
  const assignee = TEAM_MEMBERS.find((m) => m.id === incident.assigneeId);

  const durationMs = incident.resolvedAt
    ? new Date(incident.resolvedAt).getTime() - new Date(incident.createdAt).getTime()
    : Date.now() - new Date(incident.createdAt).getTime();
  const durationHours = Math.floor(durationMs / 3600000);
  const durationMins = Math.floor((durationMs % 3600000) / 60000);

  return (
    <div className="space-y-6">
      <Link href="/incidents" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" />
        Назад к инцидентам
      </Link>

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

      {/* Timeline */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-text-primary">Таймлайн расследования</h2>
        <IncidentTimeline events={incident.timeline} />
      </div>
    </div>
  );
}
