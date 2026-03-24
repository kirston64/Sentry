"use client";

import { useState } from "react";
import { ShieldAlert, ShieldOff, Eye, EyeOff, X } from "lucide-react";

interface LockdownData {
  id: string;
  status: string;
  reason: string | null;
  initiatorName: string;
  initiatedAt: Date | string;
  confirmerName: string | null;
}

export function LockdownBanner({ lockdown, userId }: { lockdown: LockdownData; userId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const isPending = lockdown.status === "pending";
  const isActive = lockdown.status === "active";

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/lockdown/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/lockdown", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ onSubmit, label }: { onSubmit: () => void; label: string }) => (
    <div className="flex items-center gap-2 mt-2">
      <div className="relative">
        <input
          type={showPass ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder="Ваш пароль"
          className="h-8 rounded border border-border bg-bg px-3 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary w-48"
          autoFocus
        />
        <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted">
          {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      <button
        onClick={onSubmit}
        disabled={loading || !password}
        className="h-8 rounded bg-error px-3 text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "..." : label}
      </button>
      <button onClick={() => { setShowConfirm(false); setShowDeactivate(false); setPassword(""); setError(""); }} className="text-text-muted hover:text-text-primary text-xs">
        Отмена
      </button>
    </div>
  );

  return (
    <div className={`border-b px-4 py-2.5 ${isActive ? "bg-error/15 border-error/40" : "bg-warning/10 border-warning/30"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2.5">
          {isActive
            ? <ShieldOff className="h-4 w-4 text-error shrink-0 mt-0.5" />
            : <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5 animate-pulse" />
          }
          <div className="text-sm">
            {isPending && (
              <>
                <span className="font-semibold text-warning">Ожидание подтверждения аварийного режима</span>
                <span className="text-text-muted ml-2 text-xs">Инициировал: {lockdown.initiatorName}</span>
                {lockdown.reason && <span className="text-text-muted ml-2 text-xs">· {lockdown.reason}</span>}
              </>
            )}
            {isActive && (
              <>
                <span className="font-semibold text-error">Аварийный режим АКТИВЕН</span>
                <span className="text-text-muted ml-2 text-xs">Не-owner пользователи заблокированы</span>
                {lockdown.reason && <span className="text-text-muted ml-2 text-xs">· {lockdown.reason}</span>}
              </>
            )}

            {error && <p className="text-xs text-error mt-1">{error}</p>}

            {showConfirm && <PasswordInput onSubmit={handleConfirm} label="Подтвердить блокировку" />}
            {showDeactivate && <PasswordInput onSubmit={handleDeactivate} label="Деактивировать" />}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPending && !showConfirm && (
            <button
              onClick={() => { setShowConfirm(true); setShowDeactivate(false); }}
              className="rounded bg-error/80 px-3 py-1 text-xs font-medium text-white hover:bg-error transition-colors"
            >
              Подтвердить блокировку
            </button>
          )}
          {(isPending || isActive) && !showDeactivate && !showConfirm && (
            <button
              onClick={() => { setShowDeactivate(true); setShowConfirm(false); }}
              className="rounded border border-border px-3 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              {isActive ? "Снять блокировку" : "Отменить"}
            </button>
          )}
          <button onClick={() => setDismissed(true)} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
