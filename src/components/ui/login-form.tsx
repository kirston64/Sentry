"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, User, Lock, AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Ошибка входа");
      }
    } catch {
      setError("Ошибка соединения");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs text-text-muted">Логин</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-border-focus"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs text-text-muted">Пароль</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-border-focus"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!username.trim() || !password || loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        <LogIn className="h-4 w-4" />
        {loading ? "Вход..." : "Войти"}
      </button>

      <p className="text-center text-[10px] text-text-muted">
        Аккаунты создаются администратором
      </p>
    </form>
  );
}
