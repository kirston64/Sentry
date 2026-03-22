"use client";

import { useEffect } from "react";

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  opts?: { ctrl?: boolean; meta?: boolean; shift?: boolean }
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = opts?.ctrl ?? false;
      const meta = opts?.meta ?? false;
      const shift = opts?.shift ?? false;

      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (ctrl && !e.ctrlKey) return;
      if (meta && !e.metaKey) return;
      if (shift && !e.shiftKey) return;

      // Match Ctrl or Meta (for cross-platform Cmd+K / Ctrl+K)
      if (ctrl || meta) {
        if (!e.ctrlKey && !e.metaKey) return;
      }

      e.preventDefault();
      callback();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, callback, opts]);
}
