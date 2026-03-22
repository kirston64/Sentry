"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { handleCommand } from "./command-handler";
import type { TerminalLine } from "@/types/console";
import { clsx } from "clsx";

const typeColors: Record<TerminalLine["type"], string> = {
  input: "text-accent",
  output: "text-text-primary",
  error: "text-error",
  system: "text-primary",
};

interface TerminalProps {
  serverName: string;
}

export function Terminal({ serverName }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: "welcome",
      type: "system",
      content: `═══ ${serverName} Console ═══\nType 'help' for available commands.\n`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add input line
    const inputLine: TerminalLine = {
      id: `in-${Date.now()}`,
      type: "input",
      content: `$ ${trimmed}`,
      timestamp: new Date().toISOString(),
    };

    if (trimmed.toLowerCase() === "clear") {
      setLines([]);
      setInput("");
      setHistory((prev) => [trimmed, ...prev].slice(0, 50));
      setHistoryIdx(-1);
      return;
    }

    const output = handleCommand(trimmed, serverName);

    // For restart, add lines with delay effect
    if (trimmed.toLowerCase() === "restart") {
      setLines((prev) => [...prev, inputLine]);
      output.forEach((line, i) => {
        setTimeout(() => {
          setLines((prev) => [...prev, line]);
        }, (i + 1) * 400);
      });
    } else {
      setLines((prev) => [...prev, inputLine, ...output]);
    }

    setInput("");
    setHistory((prev) => [trimmed, ...prev].slice(0, 50));
    setHistoryIdx(-1);
  }, [input, serverName]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length > 0) {
          const idx = Math.min(historyIdx + 1, history.length - 1);
          setHistoryIdx(idx);
          setInput(history[idx]);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIdx > 0) {
          const idx = historyIdx - 1;
          setHistoryIdx(idx);
          setInput(history[idx]);
        } else {
          setHistoryIdx(-1);
          setInput("");
        }
      }
    },
    [handleSubmit, history, historyIdx]
  );

  return (
    <div
      className="flex h-full flex-col rounded-lg border border-border bg-[#0c0c0c] font-mono text-xs"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output area */}
      <div className="flex-1 overflow-y-auto p-3 select-text">
        {lines.map((line) => (
          <div key={line.id} className={clsx("whitespace-pre-wrap leading-relaxed", typeColors[line.type])}>
            {line.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center border-t border-border bg-[#0a0a0a] px-3 py-2">
        <span className="text-success mr-2">$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-text-primary outline-none caret-success"
          placeholder="Enter command..."
          spellCheck={false}
          autoFocus
        />
        <span className="animate-blink text-success">_</span>
      </div>
    </div>
  );
}
