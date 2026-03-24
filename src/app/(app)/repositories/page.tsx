"use client";

import { useState, useEffect } from "react";
import {
  GitBranch, GitCommit, GitPullRequest, Star, Lock,
  ExternalLink, AlertCircle, Clock, ArrowLeft, GitFork,
  Users, ChevronRight, CircleDot,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RepoSummary {
  name: string; fullName: string; isPrivate: boolean;
  language: string | null; stars: number; url: string;
  description: string | null; updatedAt: string;
  defaultBranch: string; commits: Commit[]; pulls: Pull[];
}

interface Commit {
  sha: string; message: string; author: string; date: string;
}

interface Pull {
  number: number; title: string; state: string; merged: boolean;
  author: string; branch: string; baseBranch: string;
  url: string; createdAt: string;
}

interface Branch {
  name: string; sha: string; isDefault: boolean; commits: Commit[];
}

interface Contributor {
  login: string; avatar: string; contributions: number; url: string;
}

interface RepoDetail {
  name: string; fullName: string; description: string | null;
  isPrivate: boolean; language: string | null; stars: number;
  forks: number; openIssues: number; url: string;
  defaultBranch: string; updatedAt: string;
  branches: Branch[]; pulls: Pull[]; contributors: Contributor[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  JavaScript: "bg-yellow-400", TypeScript: "bg-blue-400",
  Lua: "bg-indigo-400", JSON: "bg-neutral-400",
  "C#": "bg-green-500", Python: "bg-green-400", Go: "bg-cyan-400",
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── Overview card ────────────────────────────────────────────────────────────

function RepoCard({ repo, onClick }: { repo: RepoSummary; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border border-border bg-surface p-4 text-left transition-all hover:border-primary/40 hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {repo.language && (
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${LANG_COLORS[repo.language] ?? "bg-neutral-500"}`} />
          )}
          <span className="text-sm font-medium text-primary truncate">{repo.name}</span>
          {repo.isPrivate && (
            <span className="flex shrink-0 items-center gap-0.5 rounded bg-text-muted/10 px-1.5 py-0.5 text-[10px] text-text-muted">
              <Lock className="h-2.5 w-2.5" /> private
            </span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
      </div>

      {repo.description && (
        <p className="mb-2 text-xs text-text-muted line-clamp-1">{repo.description}</p>
      )}

      <div className="flex items-center gap-3 text-[11px] text-text-muted">
        <span className="flex items-center gap-1"><Star className="h-3 w-3" />{repo.stars}</span>
        <span className="flex items-center gap-1"><GitPullRequest className="h-3 w-3 text-success" />{repo.pulls.length} PR</span>
        <span className="flex items-center gap-1"><GitCommit className="h-3 w-3" />{repo.commits.length} commits</span>
        <span className="ml-auto flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(repo.updatedAt)}</span>
      </div>
    </button>
  );
}

// ─── Detail view ──────────────────────────────────────────────────────────────

function RepoDetail({ name, onBack }: { name: string; onBack: () => void }) {
  const [data, setData] = useState<RepoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBranch, setActiveBranch] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/github/repos/${name}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setData(d);
        setActiveBranch(d.defaultBranch);
      })
      .catch(() => setError("Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-surface" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-surface" />)}
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-surface" />
    </div>
  );

  if (error || !data) return (
    <div className="rounded-lg border border-error/20 bg-error/10 p-4 text-sm text-error">{error}</div>
  );

  const currentBranch = data.branches.find((b) => b.name === activeBranch) ?? data.branches[0];
  const openPRs = data.pulls.filter((p) => p.state === "open");
  const mergedPRs = data.pulls.filter((p) => p.merged);

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Все репозитории
        </button>
        <span className="text-text-muted">/</span>
        <div className="flex items-center gap-2">
          {data.language && (
            <span className={`h-2.5 w-2.5 rounded-full ${LANG_COLORS[data.language] ?? "bg-neutral-500"}`} />
          )}
          <span className="text-sm font-semibold text-text-primary">{data.name}</span>
          {data.isPrivate && (
            <span className="flex items-center gap-0.5 rounded bg-text-muted/10 px-1.5 py-0.5 text-[10px] text-text-muted">
              <Lock className="h-2.5 w-2.5" /> private
            </span>
          )}
          <a href={data.url} target="_blank" rel="noreferrer" className="text-text-muted hover:text-primary transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {data.description && (
        <p className="text-sm text-text-muted">{data.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Star, label: "Stars", value: data.stars, color: "text-warning" },
          { icon: GitFork, label: "Forks", value: data.forks, color: "text-primary" },
          { icon: GitBranch, label: "Branches", value: data.branches.length, color: "text-accent" },
          { icon: CircleDot, label: "Issues", value: data.openIssues, color: "text-error" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-lg border border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-1.5 text-text-muted mb-1">
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              <span className="text-[11px]">{label}</span>
            </div>
            <p className="text-xl font-bold text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Branches sidebar */}
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <GitBranch className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-medium text-text-primary">Ветки</span>
            <span className="ml-auto text-xs text-text-muted">{data.branches.length}</span>
          </div>
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {data.branches.map((b) => (
              <button
                key={b.name}
                onClick={() => setActiveBranch(b.name)}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs transition-colors hover:bg-surface-hover ${
                  activeBranch === b.name ? "bg-primary/10 text-primary" : "text-text-secondary"
                }`}
              >
                <GitBranch className="h-3 w-3 shrink-0" />
                <span className="flex-1 truncate font-mono">{b.name}</span>
                {b.isDefault && (
                  <span className="rounded bg-primary/20 px-1 py-0.5 text-[9px] text-primary">default</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Commits for selected branch */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <GitCommit className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-medium text-text-primary">Коммиты</span>
            <code className="ml-1 rounded bg-surface-hover px-1.5 py-0.5 text-[11px] text-accent">
              {currentBranch?.name}
            </code>
          </div>
          <div className="divide-y divide-border">
            {currentBranch?.commits.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-text-muted">Нет коммитов</p>
            )}
            {currentBranch?.commits.map((c) => (
              <div key={c.sha} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                <code className="shrink-0 font-mono text-warning">{c.sha}</code>
                <span className="flex-1 truncate text-text-secondary">{c.message}</span>
                <div className="ml-auto flex shrink-0 items-center gap-2 text-text-muted">
                  <span className="text-accent">{c.author}</span>
                  <span>{timeAgo(c.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pull Requests */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <GitPullRequest className="h-4 w-4 text-text-muted" />
          <span className="text-sm font-medium text-text-primary">Pull Requests</span>
          <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] text-success">{openPRs.length} open</span>
          <span className="rounded bg-text-muted/10 px-1.5 py-0.5 text-[10px] text-text-muted">{mergedPRs.length} merged</span>
        </div>
        {data.pulls.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-text-muted">Нет Pull Requests</p>
        ) : (
          <div className="divide-y divide-border">
            {data.pulls.map((pr) => (
              <div key={pr.number} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                <GitPullRequest className={`h-3.5 w-3.5 shrink-0 ${pr.merged ? "text-primary" : pr.state === "open" ? "text-success" : "text-error"}`} />
                <span className="text-text-muted">#{pr.number}</span>
                <span className="flex-1 truncate text-text-secondary">{pr.title}</span>
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <code className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                    {pr.branch} → {pr.baseBranch}
                  </code>
                  <span className="text-accent">{pr.author}</span>
                  <a href={pr.url} target="_blank" rel="noreferrer" className="text-text-muted hover:text-primary">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contributors */}
      {data.contributors.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-medium text-text-primary">Контрибьюторы</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {data.contributors.map((c) => (
              <a key={c.login} href={c.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 rounded-full border border-border bg-surface-hover px-3 py-1.5 text-xs hover:border-primary/40 transition-colors"
              >
                <img src={c.avatar} alt={c.login} className="h-5 w-5 rounded-full" />
                <span className="text-text-primary">{c.login}</span>
                <span className="text-text-muted">{c.contributions}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/github/repos")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(data.configured ?? false);
        setRepos(data.repos ?? []);
        if (data.error) setError(data.error);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-surface" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-lg bg-surface" />)}
      </div>
    </div>
  );

  if (selected) {
    return <RepoDetail name={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Repositories</h1>
          <span className="ml-1 text-xs text-text-muted">{repos.length} repos</span>
        </div>
        {!configured && (
          <div className="flex items-center gap-1.5 rounded bg-warning/10 px-2.5 py-1 text-[10px] text-warning">
            <AlertCircle className="h-3 w-3" />
            Demo mode
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-xs text-error">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {repos.map((repo) => (
          <RepoCard key={repo.name} repo={repo} onClick={() => setSelected(repo.name)} />
        ))}
      </div>
    </div>
  );
}
