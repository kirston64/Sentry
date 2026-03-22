"use client";

import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

interface ToastProps {
  item: { id: string; message: string; type: "success" | "error" | "info" | "warning" };
  onDismiss: () => void;
}

const config = {
  success: { icon: CheckCircle, color: "border-success text-success" },
  error: { icon: AlertCircle, color: "border-error text-error" },
  info: { icon: Info, color: "border-primary text-primary" },
  warning: { icon: AlertTriangle, color: "border-warning text-warning" },
};

export function Toast({ item, onDismiss }: ToastProps) {
  const { icon: Icon, color } = config[item.type];

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-lg border-l-4 bg-surface px-4 py-3 shadow-lg animate-slide-in",
        color
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-sm text-text-primary">{item.message}</span>
      <button onClick={onDismiss} className="ml-2 shrink-0 text-text-muted hover:text-text-primary">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
