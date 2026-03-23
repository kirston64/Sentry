"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertTriangle className="mb-4 h-10 w-10 text-error" />
      <h2 className="text-lg font-bold text-text-primary">Что-то пошло не так</h2>
      <p className="mt-1 text-sm text-text-muted">{error.message || "Произошла ошибка"}</p>
      <button
        onClick={reset}
        className="mt-4 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        <RefreshCw className="h-4 w-4" />
        Попробовать снова
      </button>
    </div>
  );
}
