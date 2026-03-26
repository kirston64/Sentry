"use client";

import { useState, useEffect } from "react";
import { BookOpen, GitCommit, CheckCircle2, XCircle, Loader2, Clock, Filter } from "lucide-react";

interface Deploy {
  id: string;
  version: string;
  environment: string;
  status: string;
  commitSha: string;
  commitMsg: string;
  startedAt: string;
  finishedAt: string | null;
  server: { name: string } | null;
  user: { username: string; fullName: string };
}

const ENV_COLOR: Record<string, string> = {
  production: "bg-error/15 text-error border-error/20",
  staging: "bg-warning/15 text-warning border-warning/20",
  development: "bg-primary/15 text-primary border-primary/20",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
  failed: <XCircle className="h-3.5 w-3.5 text-error" />,
  rolling: <Loader2 className="h-3.5 w-3.5 text-warning animate-spin" />,
  pending: <Clock className="h-3.5 w-3.5 text-text-muted" />,
};

function groupByVersion(deploys: Deploy[]) {
  const groups: Record<string, Deploy[]> = {};
  for (const d of deploys) {
    if (!groups[d.version]) groups[d.version] = [];
    groups[d.version].push(d);
  }
  return groups;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ChangelogPage() {
  const [deploys, setDeploys] = useState<Deploy[]>([]);
  const [loading, setLoading] = useState(true);
  const [envFilter, setEnvFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/deploys")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setDeploys(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = envFilter === "all" ? deploys : deploys.filter(d => d.environment === envFilter);
  const groups = groupByVersion(filtered);
  const versions = Object.keys(groups).sort((a, b) => {
    const latestA = Math.max(...groups[a].map(d => new Date(d.startedAt).getTime()));
    const latestB = Math.max(...groups[b].map(d => new Date(d.startedAt).getTime()));
    return latestB - latestA;
  });

  const envs = [...new Set(deploys.map(d => d.environment))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Changelog</h1>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-text-muted" />
          <div className="flex gap-1 rounded border border-border bg-surface p-0.5">
            <button
              onClick={() => setEnvFilter("all")}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${envFilter === "all" ? "bg-primary text-white" : "text-text-muted hover:text-text-primary"}`}
            >
              Все
            </button>
            {envs.map(e => (
              <button
                key={e}
                onClick={() => setEnvFilter(e)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors capitalize ${envFilter === e ? "bg-primary text-white" : "text-text-muted hover:text-text-primary"}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-lg bg-surface" />)}
        </div>
      ) : versions.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface py-16 text-center text-sm text-text-muted">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Нет деплоев</p>
        </div>
      ) : (
        <div className="relative space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
          {versions.map(version => {
            const vDeploys = groups[version];
            const latest = vDeploys.reduce((a, b) => new Date(a.startedAt) > new Date(b.startedAt) ? a : b);
            const allSuccess = vDeploys.every(d => d.status === "success");
            const anyFailed = vDeploys.some(d => d.status === "failed");

            return (
              <div key={version} className="relative pl-10">
                {/* dot */}
                <div className={`absolute left-1.5 top-1 h-4 w-4 rounded-full border-2 border-bg ${allSuccess ? "bg-success" : anyFailed ? "bg-error" : "bg-warning"}`} />

                <div className="rounded-lg border border-border bg-surface overflow-hidden">
                  {/* version header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-hover">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-text-primary">v{version}</span>
                      <span className="text-xs text-text-muted">{fmtDate(latest.startedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      {vDeploys.length} деплой{vDeploys.length > 1 ? "а" : ""}
                      {allSuccess && <span className="text-success font-medium">✓ Все успешны</span>}
                      {anyFailed && <span className="text-error font-medium">✗ Есть ошибки</span>}
                    </div>
                  </div>

                  {/* deploy entries */}
                  <div className="divide-y divide-border">
                    {vDeploys.map(d => (
                      <div key={d.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="mt-0.5">{STATUS_ICON[d.status] ?? STATUS_ICON.pending}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${ENV_COLOR[d.environment] ?? "bg-surface-hover text-text-muted border-border"}`}>
                              {d.environment}
                            </span>
                            {d.server && <span className="text-[11px] text-text-muted">{d.server.name}</span>}
                            <span className="font-mono text-[11px] text-text-muted">{d.commitSha.slice(0, 7)}</span>
                          </div>
                          <p className="mt-1 text-sm text-text-primary flex items-center gap-1">
                            <GitCommit className="h-3 w-3 text-text-muted shrink-0" />
                            {d.commitMsg}
                          </p>
                          <p className="mt-0.5 text-[11px] text-text-muted">
                            {fmtDate(d.startedAt)} · @{d.user.username}
                            {d.finishedAt && ` · ${Math.round((new Date(d.finishedAt).getTime() - new Date(d.startedAt).getTime()) / 1000)}с`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
