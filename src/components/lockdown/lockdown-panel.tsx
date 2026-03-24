"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, ShieldOff, ShieldCheck, Eye, EyeOff, AlertTriangle } from "lucide-react";

interface LockdownState {
  status: string; // inactive | pending | active
  reason?: string | null;
  initiatorName?: string;
  initiatedAt?: string;
  confirmerName?: string;
}

export function LockdownPanel() {
  const [lockdown, setLockdown] = useState<LockdownState>({ status: "inactive" });
  const [loading, setLoading] = useState(true);

  // Initiate form
  const [showInitiate, setShowInitiate] = useState(false);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Deactivate form
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactPassword, setDeactPassword] = useState("");
  const [showDeactPass, setShowDeactPass] = useState(false);

  const fetchStatus = () => {
    fetch("/api/lockdown")
      .then((r) => r.json())
      .then((d) => setLockdown(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 10_000);
    return () => clearInterval(iv);
  }, []);

  const initiate = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/lockdown/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setShowInitiate(false);
      setReason("");
      setPassword("");
      fetchStatus();
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/lockdown", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deactPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setShowDeactivate(false);
      setDeactPassword("");
      fetchStatus();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="h-24 animate-pulse rounded-lg bg-surface" />;
  }

  const isInactive = lockdown.status === "inactive";
  const isPending  = lockdown.status === "pending";
  const isActive   = lockdown.status === "active";

  return (
    <div className={`rounded-lg border p-5 space-y-4 ${
      isActive  ? "border-error/50 bg-error/5" :
      isPending ? "border-warning/50 bg-warning/5" :
                  "border-border bg-surface"
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        {isActive  && <ShieldOff className="h-5 w-5 text-error" />}
        {isPending && <ShieldAlert className="h-5 w-5 text-warning animate-pulse" />}
        {isInactive && <ShieldCheck className="h-5 w-5 text-success" />}
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Аварийный режим</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {isInactive && "Система работает в штатном режиме"}
            {isPending  && `Ожидание подтверждения — инициировал ${lockdown.initiatorName}`}
            {isActive   && `Активен · Все не-owner пользователи заблокированы`}
          </p>
        </div>
        <div className="ml-auto">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            isActive  ? "bg-error/20 text-error" :
            isPending ? "bg-warning/20 text-warning" :
                        "bg-success/20 text-success"
          }`}>
            {isInactive ? "Норма" : isPending ? "Ожидание" : "АКТИВЕН"}
          </span>
        </div>
      </div>

      {/* Active status detail */}
      {(isPending || isActive) && (
        <div className="rounded border border-border/50 bg-bg p-3 space-y-1 text-xs text-text-muted">
          {lockdown.reason && (
            <div className="flex gap-2">
              <span className="text-text-secondary font-medium w-24 shrink-0">Причина:</span>
              <span>{lockdown.reason}</span>
            </div>
          )}
          {lockdown.initiatorName && (
            <div className="flex gap-2">
              <span className="text-text-secondary font-medium w-24 shrink-0">Инициировал:</span>
              <span>{lockdown.initiatorName}</span>
            </div>
          )}
          {lockdown.confirmerName && (
            <div className="flex gap-2">
              <span className="text-text-secondary font-medium w-24 shrink-0">Подтвердил:</span>
              <span>{lockdown.confirmerName}</span>
            </div>
          )}
        </div>
      )}

      {/* Warning for initiation */}
      {isInactive && !showInitiate && (
        <div className="rounded border border-warning/20 bg-warning/5 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted">
            При активации все пользователи кроме owner немедленно потеряют доступ.
            Требуется подтверждение от второго owner с вводом пароля.
          </p>
        </div>
      )}

      {/* INITIATE FORM */}
      {showInitiate && (
        <div className="space-y-3 rounded border border-error/30 bg-error/5 p-4">
          <p className="text-xs font-medium text-error">Инициировать аварийную блокировку</p>
          {error && <p className="rounded bg-error/10 px-3 py-2 text-xs text-error border border-error/20">{error}</p>}
          <div>
            <label className="block text-xs text-text-muted mb-1">Причина (необязательно)</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Например: подозрительная активность"
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Ваш пароль для подтверждения</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && initiate()}
                placeholder="Введите пароль"
                className="w-full rounded border border-border bg-bg px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-error"
              />
              <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={initiate}
              disabled={busy || !password}
              className="flex-1 rounded bg-error py-2 text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50 transition-colors"
            >
              {busy ? "Инициирую..." : "Инициировать блокировку"}
            </button>
            <button
              onClick={() => { setShowInitiate(false); setError(""); setPassword(""); setReason(""); }}
              className="rounded border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* DEACTIVATE FORM */}
      {showDeactivate && (
        <div className="space-y-3 rounded border border-border p-4">
          <p className="text-xs font-medium text-text-primary">Снять аварийный режим</p>
          {error && <p className="rounded bg-error/10 px-3 py-2 text-xs text-error border border-error/20">{error}</p>}
          <div>
            <label className="block text-xs text-text-muted mb-1">Ваш пароль</label>
            <div className="relative">
              <input
                type={showDeactPass ? "text" : "password"}
                value={deactPassword}
                onChange={(e) => setDeactPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && deactivate()}
                placeholder="Введите пароль"
                className="w-full rounded border border-border bg-bg px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
              <button type="button" onClick={() => setShowDeactPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                {showDeactPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={deactivate}
              disabled={busy || !deactPassword}
              className="flex-1 rounded bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {busy ? "Снимаю..." : "Снять блокировку"}
            </button>
            <button
              onClick={() => { setShowDeactivate(false); setError(""); setDeactPassword(""); }}
              className="rounded border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!showInitiate && !showDeactivate && (
        <div className="flex gap-2">
          {isInactive && (
            <button
              onClick={() => setShowInitiate(true)}
              className="rounded border border-error/50 bg-error/10 px-4 py-2 text-sm font-medium text-error hover:bg-error/20 transition-colors"
            >
              Инициировать аварийный режим
            </button>
          )}
          {(isPending || isActive) && (
            <button
              onClick={() => setShowDeactivate(true)}
              className="rounded border border-border px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              {isPending ? "Отменить инициацию" : "Снять блокировку"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
