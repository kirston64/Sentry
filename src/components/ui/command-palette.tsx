"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import {
  Search,
  LayoutDashboard,
  Server,
  GitBranch,
  Users,
  CheckSquare,
  Activity,
  Settings,
  TerminalSquare,
  Rocket,
  AlertTriangle,
  ScrollText,
  RotateCcw,
  Plus,
  User,
} from "lucide-react";
import { clsx } from "clsx";

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  section: "Navigation" | "Actions" | "Tasks" | "Incidents" | "Team";
  icon: React.ElementType;
  action: () => void;
}

interface SearchResult {
  tasks: { id: string; title: string; status: string; priority: string }[];
  incidents: { id: string; title: string; severity: string; status: string }[];
  users: { id: string; username: string; fullName: string }[];
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items: PaletteItem[] = [
    { id: "dashboard", label: "Dashboard", section: "Navigation", icon: LayoutDashboard, action: () => router.push("/dashboard") },
    { id: "servers", label: "Servers", section: "Navigation", icon: Server, action: () => router.push("/servers") },
    { id: "repos", label: "Repositories", section: "Navigation", icon: GitBranch, action: () => router.push("/repositories") },
    { id: "team", label: "Team", section: "Navigation", icon: Users, action: () => router.push("/team") },
    { id: "tasks", label: "Tasks", section: "Navigation", icon: CheckSquare, action: () => router.push("/tasks") },
    { id: "activity", label: "Activity", section: "Navigation", icon: Activity, action: () => router.push("/activity") },
    { id: "deploys", label: "Deploys", section: "Navigation", icon: Rocket, action: () => router.push("/deploys") },
    { id: "incidents", label: "Incidents", section: "Navigation", icon: AlertTriangle, action: () => router.push("/incidents") },
    { id: "logs", label: "Logs", section: "Navigation", icon: ScrollText, action: () => router.push("/logs") },
    { id: "console", label: "Console", section: "Navigation", icon: TerminalSquare, action: () => router.push("/console") },
    { id: "settings", label: "Settings", section: "Navigation", icon: Settings, action: () => router.push("/settings") },
    { id: "deploy", label: "Deploy to Dev", section: "Actions", icon: Rocket, action: () => {} },
    { id: "restart", label: "Restart Server", section: "Actions", icon: RotateCcw, action: () => {} },
    { id: "newtask", label: "Create Task", section: "Actions", icon: Plus, action: () => router.push("/tasks") },
  ];

  // Debounced search against real data
  useEffect(() => {
    if (!open || query.length < 2) { setSearchResults(null); return; }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setSearchResults(await res.json());
      } catch { /* ignore */ }
      setSearching(false);
    }, 250);
  }, [query, open]);

  const resultItems: PaletteItem[] = searchResults ? [
    ...searchResults.tasks.map((t) => ({
      id: `task-${t.id}`,
      label: t.title,
      sublabel: `${t.status} · ${t.priority}`,
      section: "Tasks" as const,
      icon: CheckSquare,
      action: () => router.push("/tasks"),
    })),
    ...searchResults.incidents.map((i) => ({
      id: `incident-${i.id}`,
      label: i.title,
      sublabel: `${i.severity} · ${i.status}`,
      section: "Incidents" as const,
      icon: AlertTriangle,
      action: () => router.push(`/incidents/${i.id}`),
    })),
    ...searchResults.users.map((u) => ({
      id: `user-${u.id}`,
      label: u.fullName,
      sublabel: `@${u.username}`,
      section: "Team" as const,
      icon: User,
      action: () => router.push(`/team/${u.id}`),
    })),
  ] : [];

  const navFiltered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  const filtered = query.length >= 2 && searchResults
    ? [...resultItems, ...navFiltered]
    : navFiltered;

  const toggle = useCallback(() => {
    setOpen((o) => !o);
    setQuery("");
    setSelectedIdx(0);
    setSearchResults(null);
  }, []);

  useKeyboardShortcut("k", toggle, { ctrl: true });

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      item.action();
      setOpen(false);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIdx]) {
        handleSelect(filtered[selectedIdx]);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [filtered, selectedIdx, handleSelect]
  );

  if (!open) return null;

  const sections = [...new Set(filtered.map((i) => i.section))];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={() => setOpen(false)} />
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-md -translate-x-1/2 rounded-lg border border-border bg-surface shadow-xl animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Поиск задач, инцидентов, команды..."
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder-text-muted"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-text-muted">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1">
          {searching && (
            <p className="px-3 py-3 text-center text-xs text-text-muted animate-pulse">Поиск...</p>
          )}
          {!searching && filtered.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-text-muted">
              Ничего не найдено
            </p>
          )}
          {!searching && sections.map((section) => (
            <div key={section}>
              <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                {section}
              </p>
              {filtered
                .filter((i) => i.section === section)
                .map((item) => {
                  const globalIdx = filtered.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIdx(globalIdx)}
                      className={clsx(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                        globalIdx === selectedIdx
                          ? "bg-surface-hover text-text-primary"
                          : "text-text-secondary"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-text-muted" />
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {item.sublabel && (
                        <span className="text-[10px] text-text-muted shrink-0">{item.sublabel}</span>
                      )}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-border px-3 py-2 text-[10px] text-text-muted">
          <span>↑↓ навигация</span>
          <span>↵ выбрать</span>
          <span>esc закрыть</span>
        </div>
      </div>
    </>
  );
}
