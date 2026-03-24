"use client";

import { useState } from "react";
import { KeyRound, Send, Copy, Check, Loader2 } from "lucide-react";

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
}

interface OTPManagerProps {
  users: User[];
}

interface GeneratedOTP {
  code: string;
  username: string;
  sentToTelegram: boolean;
  expiresAt: Date;
}

export function OTPManager({ users }: OTPManagerProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedOTP | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/otp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          code: data.code,
          username: data.username,
          sentToTelegram: data.sentToTelegram,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const otherUsers = users.filter((u) => u.role !== "owner");

  return (
    <div className="p-5 space-y-4">
      <p className="text-xs text-text-muted">
        Сгенерируй одноразовый код входа для сотрудника. Код действует 5 минут.
      </p>

      <div className="flex gap-2">
        <select
          value={selectedUserId}
          onChange={(e) => { setSelectedUserId(e.target.value); setResult(null); }}
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-border-focus"
        >
          <option value="">Выбери сотрудника...</option>
          {otherUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName} (@{u.username}) — {u.role}
            </option>
          ))}
        </select>

        <button
          onClick={generate}
          disabled={!selectedUserId || loading}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Создать код
        </button>
      </div>

      {result && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">
              Код для <span className="font-medium text-text-primary">@{result.username}</span>
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <Send className="h-3 w-3" />
              {result.sentToTelegram ? "Отправлен в Telegram пользователю" : "Отправлен в ваш Telegram"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <span className="text-3xl font-mono font-bold tracking-[0.3em] text-primary">
                {result.code}
              </span>
            </div>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          <p className="text-center text-[11px] text-text-muted">
            ⏱ Действует до {result.expiresAt.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}
    </div>
  );
}
