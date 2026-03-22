"use client";

import { useRef, useEffect } from "react";
import { Pause, Play, Trash2 } from "lucide-react";
import { LogLine } from "./log-line";
import type { LogEntry } from "@/types/log-entry";

interface LogViewerProps {
  logs: LogEntry[];
  paused: boolean;
  onTogglePause: () => void;
  onClear: () => void;
}

export function LogViewer({ logs, paused, onTogglePause, onClear }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    if (!paused && stickToBottom.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, paused]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    stickToBottom.current = scrollHeight - scrollTop - clientHeight < 40;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePause}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          {paused && <span className="text-warning font-medium">PAUSED</span>}
          <span>{logs.length} строк</span>
        </div>
      </div>

      {/* Log output */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden py-1 custom-scrollbar"
        style={{ minHeight: 0 }}
      >
        {logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">Нет логов</p>
        ) : (
          logs.map((entry) => <LogLine key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
