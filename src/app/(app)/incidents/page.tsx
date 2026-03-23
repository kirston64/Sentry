"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Plus, Filter } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { IncidentCard } from "@/components/incidents/incident-card";
import { CreateIncidentModal } from "@/components/incidents/create-incident-modal";
import { SEED_INCIDENTS } from "@/lib/mock-data";
import type { Incident, Severity } from "@/types/incident";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useLocalStorage<Incident[]>("sentry_incidents", SEED_INCIDENTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (statusFilter === "active" && inc.status === "resolved") return false;
      if (statusFilter === "resolved" && inc.status !== "resolved") return false;
      if (severityFilter !== "all" && inc.severity !== severityFilter) return false;
      return true;
    });
  }, [incidents, statusFilter, severityFilter]);

  const handleCreate = (incident: Incident) => {
    setIncidents((prev) => [incident, ...prev]);
    setModalOpen(false);
  };

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
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-error px-3 py-2 text-xs font-medium text-white hover:bg-error/80"
        >
          <Plus className="h-3.5 w-3.5" />
          Report Incident
        </button>
      </div>

      {/* Filters */}
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
          <IncidentCard key={incident.id} incident={incident} />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">Нет инцидентов</p>
        )}
      </div>

      {modalOpen && <CreateIncidentModal onSave={handleCreate} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
