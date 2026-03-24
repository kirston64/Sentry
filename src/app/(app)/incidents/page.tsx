"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { AlertTriangle, Plus, Filter, FileDown } from "lucide-react";
import { IncidentCard } from "@/components/incidents/incident-card";
import { CreateIncidentModal } from "@/components/incidents/create-incident-modal";
import { downloadCSV, downloadJSON } from "@/lib/export";
import type { Severity } from "@/types/incident";

interface IncidentData {
  id: string;
  title: string;
  severity: Severity;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  assignee: { id: string; username: string; fullName: string } | null;
  creator: { id: string; username: string; fullName: string };
  timeline: { id: string; message: string; createdAt: string; author: { username: string; fullName: string } }[];
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");

  const fetchIncidents = useCallback(async () => {
    const res = await fetch("/api/incidents");
    if (res.ok) setIncidents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (statusFilter === "active" && inc.status === "resolved") return false;
      if (statusFilter === "resolved" && inc.status !== "resolved") return false;
      if (severityFilter !== "all" && inc.severity !== severityFilter) return false;
      return true;
    });
  }, [incidents, statusFilter, severityFilter]);

  const handleCreated = () => {
    setModalOpen(false);
    fetchIncidents();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-surface" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Incidents</h1>
          <span className="ml-2 text-xs text-text-muted">
            {incidents.filter((i) => i.status !== "resolved").length} active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              downloadCSV(
                filtered.map((inc) => ({
                  id: inc.id,
                  title: inc.title,
                  severity: inc.severity,
                  status: inc.status,
                  creator: inc.creator.fullName || inc.creator.username,
                  assignee: inc.assignee ? inc.assignee.fullName || inc.assignee.username : "",
                  createdAt: inc.createdAt,
                  resolvedAt: inc.resolvedAt ?? "",
                })),
                `incidents-${new Date().toISOString().slice(0, 10)}`
              )
            }
            className="flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
            title="Экспорт CSV"
          >
            <FileDown className="h-3.5 w-3.5" />
            CSV
          </button>
          <button
            onClick={() =>
              downloadJSON(filtered, `incidents-${new Date().toISOString().slice(0, 10)}`)
            }
            className="flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
            title="Экспорт JSON"
          >
            <FileDown className="h-3.5 w-3.5" />
            JSON
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-error px-3 py-2 text-xs font-medium text-white hover:bg-error/80"
          >
            <Plus className="h-3.5 w-3.5" />
            Report Incident
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <Filter className="h-3 w-3" />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                statusFilter === f ? "bg-surface-hover text-text-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {f === "all" ? "Все" : f === "active" ? "Активные" : "Resolved"}
            </button>
          ))}
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as Severity | "all")}
          className="rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary"
        >
          <option value="all">Все severity</option>
          <option value="P1">P1 Critical</option>
          <option value="P2">P2 High</option>
          <option value="P3">P3 Medium</option>
          <option value="P4">P4 Low</option>
        </select>
        {(statusFilter !== "all" || severityFilter !== "all") && (
          <button
            onClick={() => { setStatusFilter("all"); setSeverityFilter("all"); }}
            className="text-[10px] text-primary hover:underline"
          >
            Сбросить
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.map((incident) => (
          <IncidentCard key={incident.id} incident={{
            id: incident.id,
            title: incident.title,
            severity: incident.severity,
            status: incident.status as "investigating" | "identified" | "monitoring" | "resolved",
            assigneeId: incident.assignee?.id || null,
            createdAt: incident.createdAt,
            resolvedAt: incident.resolvedAt,
            timeline: incident.timeline.map(e => ({
              timestamp: e.createdAt,
              message: e.message,
              author: e.author.fullName || e.author.username,
            })),
          }} />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">Нет инцидентов</p>
        )}
      </div>

      {modalOpen && <CreateIncidentModal onSave={handleCreated} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
