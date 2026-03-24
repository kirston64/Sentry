"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldAlert, X, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface FailedLogin {
  id: string;
  username: string;
  ip: string;
  reason: string;
  createdAt: string;
}

const REASON_LABELS: Record<string, string> = {
  wrong_password: "неверный пароль",
  wrong_otp: "неверный OTP",
  rate_limit: "превышен лимит",
  user_not_found: "логин не найден",
};

function timeAgo(iso: string) {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}с назад`;
  if (sec < 3600) return `${Math.floor(sec / 60)}м назад`;
  return `${Math.floor(sec / 3600)}ч назад`;
}

export function FailedLoginsAlert() {
  const [attempts, setAttempts] = useState<FailedLogin[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchAttempts = useCallback(() => {
    fetch("/api/auth/attempts")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        if (Array.isArray(data)) setAttempts(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAttempts();
    const interval = setInterval(fetchAttempts, 30_000);
    return () => clearInterval(interval);
  }, [fetchAttempts]);

  const clearAll = async () => {
    await fetch("/api/auth/attempts", { method: "DELETE" });
    setAttempts([]);
    setDismissed(true);
  };

  if (dismissed || attempts.length === 0) return null;

  const recent = attempts.slice(0, 3);
  const totalCount = attempts.length;

  // Group by IP to detect brute force
  const byIP = attempts.reduce<Record<string, number>>((acc, a) => {
    acc[a.ip] = (acc[a.ip] || 0) + 1;
    return acc;
  }, {});
  const suspiciousIPs = Object.entries(byIP).filter(([, count]) => count >= 3);

  return (
    <div className="rounded-lg border border-error/50 bg-error/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-error animate-pulse" />
          <span className="text-sm font-bold text-error">
            {totalCount} неудачных попытки входа за 24ч
          </span>
          {suspiciousIPs.length > 0 && (
            <span className="rounded bg-error/20 px-1.5 py-0.5 text-[10px] font-medium text-error">
              ⚡ Brute force
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs text-error/70 hover:text-error transition-colors"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? "Свернуть" : "Подробнее"}
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-error/70 hover:text-error transition-colors"
            title="Очистить все"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-error/70 hover:text-error transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Suspicious IPs warning */}
      {suspiciousIPs.length > 0 && (
        <div className="border-t border-error/20 bg-error/5 px-4 py-2">
          <p className="text-xs text-error font-medium">
            Подозрительная активность с IP:{" "}
            {suspiciousIPs.map(([ip, count]) => (
              <span key={ip} className="font-mono">
                {ip} ({count} попыток){" "}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Attempts list */}
      {expanded && (
        <div className="border-t border-error/20 divide-y divide-error/10">
          {attempts.slice(0, 20).map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-text-primary">{a.username}</span>
                <span className="text-error/70">{REASON_LABELS[a.reason] || a.reason}</span>
                <span className="font-mono text-text-muted">{a.ip}</span>
              </div>
              <span className="text-text-muted">{timeAgo(a.createdAt)}</span>
            </div>
          ))}
          {totalCount > 20 && (
            <p className="px-4 py-2 text-center text-xs text-error/60">
              и ещё {totalCount - 20} попыток...
            </p>
          )}
        </div>
      )}

      {/* Preview (collapsed) */}
      {!expanded && (
        <div className="border-t border-error/20 divide-y divide-error/10">
          {recent.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-4 py-1.5 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-text-primary">{a.username}</span>
                <span className="text-error/70">{REASON_LABELS[a.reason] || a.reason}</span>
                <span className="font-mono text-text-muted">{a.ip}</span>
              </div>
              <span className="text-text-muted">{timeAgo(a.createdAt)}</span>
            </div>
          ))}
          {totalCount > 3 && (
            <p className="px-4 py-1.5 text-center text-[11px] text-error/60">
              +{totalCount - 3} ещё...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
