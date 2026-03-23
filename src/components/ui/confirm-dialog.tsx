"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 animate-fade-in" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-xl animate-scale-in">
        <div className="flex items-start gap-3">
          {danger && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-error/20">
              <AlertTriangle className="h-4 w-4 text-error" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-text-primary">{title}</h3>
            <p className="mt-1 text-xs text-text-secondary">{message}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded px-4 py-1.5 text-xs font-medium text-white ${
              danger ? "bg-error hover:bg-error/80" : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
