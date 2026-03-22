"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, User, ShieldCheck } from "lucide-react";
import type { UserRole } from "@/types/database";

const roles: { value: UserRole; label: string; color: string }[] = [
  { value: "owner", label: "Owner", color: "text-error" },
  { value: "admin", label: "Admin", color: "text-warning" },
  { value: "developer", label: "Developer", color: "text-accent" },
];

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<UserRole>("developer");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), role }),
    });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
      <div>
        <label className="mb-1.5 block text-xs text-text-muted">Имя пользователя</label>
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
        <label className="mb-1.5 block text-xs text-text-muted">Роль</label>
        <div className="flex gap-2">
          {roles.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                role === r.value
                  ? "border-border-focus bg-surface-hover " + r.color
                  : "border-border bg-surface text-text-secondary hover:border-border-focus"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!username.trim() || loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        <LogIn className="h-4 w-4" />
        {loading ? "Вход..." : "Войти"}
      </button>

      <p className="text-center text-[10px] text-text-muted">
        Dev-режим — вход без внешних сервисов
      </p>
    </form>
  );
}
