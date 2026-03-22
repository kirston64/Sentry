"use client";

import { useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { IncidentCard } from "@/components/incidents/incident-card";
import { CreateIncidentModal } from "@/components/incidents/create-incident-modal";
import { SEED_INCIDENTS } from "@/lib/mock-data";
import type { Incident } from "@/types/incident";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useLocalStorage<Incident[]>("sentry_incidents", SEED_INCIDENTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");

  const filtered = incidents.filter((inc) => {
    if (filter === "active") return inc.status !== "resolved";
    if (filter === "resolved") return inc.status === "resolved";
    return true;
  });

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
      <div className="flex gap-1">
        {(["all", "active", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              filter === f ? "bg-surface-hover text-text-primary" : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {f === "all" ? "Все" : f === "active" ? "Активные" : "Resolved"}
          </button>
        ))}
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
