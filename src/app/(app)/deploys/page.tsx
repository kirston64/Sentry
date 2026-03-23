"use client";

import { useState, useMemo, useEffect } from "react";
import { Rocket, Filter } from "lucide-react";
import { DeployCard } from "@/components/deploys/deploy-card";
import { DeployButton } from "@/components/deploys/deploy-button";
import type { Deploy, DeployStatus } from "@/types/deploy";

export default function DeploysPage() {
  const [deploys, setDeploys] = useState<(Deploy & { triggeredByName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [envFilter, setEnvFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<DeployStatus | "all">("all");

  useEffect(() => {
    fetch("/api/deploys").then(r => r.json()).then(setDeploys).finally(() => setLoading(false));
  }, []);

  const environments = useMemo(() => [...new Set(deploys.map((d) => d.environment))], [deploys]);

  const filtered = useMemo(() => {
    return deploys.filter((d) => {
      if (envFilter !== "all" && d.environment !== envFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      return true;
    });
  }, [deploys, envFilter, statusFilter]);

  const successCount = deploys.filter((d) => d.status === "success").length;
  const failCount = deploys.filter((d) => d.status === "failed").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-lg bg-surface" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Deploys</h1>
          <span className="ml-2 text-xs text-text-muted">
            {successCount} success, {failCount} failed
          </span>
        </div>
        <DeployButton />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <Filter className="h-3 w-3" />
          Фильтры:
        </div>
        <select
          value={envFilter}
          onChange={(e) => setEnvFilter(e.target.value)}
          className="rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary"
        >
          <option value="all">Все окружения</option>
          {environments.map((env) => (
            <option key={env} value={env}>{env}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DeployStatus | "all")}
          className="rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary"
        >
          <option value="all">Все статусы</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="rolling">Rolling</option>
          <option value="pending">Pending</option>
        </select>
        {(envFilter !== "all" || statusFilter !== "all") && (
          <button
            onClick={() => { setEnvFilter("all"); setStatusFilter("all"); }}
            className="text-[10px] text-primary hover:underline"
          >
            Сбросить
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.map((deploy) => (
          <DeployCard key={deploy.id} deploy={{
            ...deploy,
            triggeredBy: deploy.triggeredByName || deploy.triggeredBy,
          }} />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">Нет деплоев с выбранными фильтрами</p>
        )}
      </div>
    </div>
  );
}
