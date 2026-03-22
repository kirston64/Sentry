"use client";

import { Rocket, RotateCcw, Plus, FileText } from "lucide-react";

const actions = [
  { icon: Rocket, label: "Deploy to Dev", color: "text-success" },
  { icon: RotateCcw, label: "Restart Server", color: "text-warning" },
  { icon: Plus, label: "Create Task", color: "text-primary" },
  { icon: FileText, label: "View Logs", color: "text-accent" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {actions.map(({ icon: Icon, label, color }) => (
        <button
          key={label}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-xs text-text-secondary transition-colors hover:border-border-focus hover:bg-surface-hover hover:text-text-primary"
        >
          <Icon className={`h-4 w-4 ${color}`} />
          {label}
        </button>
      ))}
    </div>
  );
}
