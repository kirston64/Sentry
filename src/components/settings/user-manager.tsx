"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, Ban, ShieldCheck, KeyRound, UserPlus, X, Eye, EyeOff, ChevronDown } from "lucide-react";

interface UserData {
  id: string;
  username: string;
  fullName: string;
  role: string;
  createdAt: string;
  passwordChangedAt: string;
  banned?: boolean;
}

const roleColors: Record<string, string> = {
  owner: "bg-error/20 text-error",
  admin: "bg-warning/20 text-warning",
  developer: "bg-primary/20 text-primary",
};

// ─── Add User Modal ─────────────────────────────────────────────────────────

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ username: "", fullName: "", password: "", role: "developer" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-text-primary">Добавить пользователя</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Логин</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="например: ivan" required autoComplete="off"
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Полное имя</label>
            <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
              placeholder="Иван Петров" required
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Пароль</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Минимум 6 символов" required
                className="w-full rounded border border-border bg-bg px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary" />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Роль</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
              <option value="developer">Developer</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded border border-border py-2 text-sm text-text-muted hover:text-text-primary transition-colors">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 rounded bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading ? "Создание..." : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Change Password Modal ───────────────────────────────────────────────────

function ChangePasswordModal({ user, onClose }: { user: UserData; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      setDone(true);
      setTimeout(onClose, 1200);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Сменить пароль</h2>
            <p className="text-xs text-text-muted mt-0.5">@{user.username} · {user.fullName}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="h-4 w-4" /></button>
        </div>
        {done ? (
          <p className="text-sm text-success text-center py-3">Пароль изменён</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Новый пароль (мин. 6 символов)" required
                className="w-full rounded border border-border bg-bg px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary" />
              <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-error">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 rounded border border-border py-2 text-sm text-text-muted hover:text-text-primary transition-colors">Отмена</button>
              <button type="submit" disabled={loading} className="flex-1 rounded bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {loading ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Ban Modal ────────────────────────────────────────────────────────────────

function BanModal({ user, onClose, onDone }: { user: UserData; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-error/40 bg-surface p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 text-error" />
            <h2 className="text-sm font-bold text-error">Заблокировать пользователя</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="h-4 w-4" /></button>
        </div>
        <div className="mb-4 rounded-lg border border-border bg-bg p-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-error/10 flex items-center justify-center text-xs font-bold text-error">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{user.username}</p>
            <p className="text-xs text-text-muted">{user.fullName} · {user.role}</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <textarea value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Причина блокировки..." rows={3} required
            className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-error resize-none" />
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-2.5 text-xs text-text-muted">
            Все сессии пользователя будут немедленно завершены.
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded border border-border py-2 text-sm text-text-muted hover:text-text-primary transition-colors">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 rounded bg-error py-2 text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50 transition-colors">
              {loading ? "Блокировка..." : "Заблокировать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function UserManager({ users: initialUsers }: { users: UserData[] }) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [showAdd, setShowAdd] = useState(false);
  const [changePassFor, setChangePassFor] = useState<UserData | null>(null);
  const [banFor, setBanFor] = useState<UserData | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const reload = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  };

  const deleteUser = async (u: UserData) => {
    if (!confirm(`Удалить пользователя "${u.fullName}"? Это нельзя отменить.`)) return;
    await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: u.id }) });
    reload();
  };

  const unban = async (u: UserData) => {
    await fetch(`/api/users/${u.id}/ban`, { method: "DELETE" });
    reload();
  };

  return (
    <>
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onCreated={reload} />}
      {changePassFor && <ChangePasswordModal user={changePassFor} onClose={() => setChangePassFor(null)} />}
      {banFor && <BanModal user={banFor} onClose={() => setBanFor(null)} onDone={reload} />}

      {/* Header with Add button */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-xs text-text-muted">{users.length} пользователей</span>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded bg-primary/10 border border-primary/30 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
          <UserPlus className="h-3.5 w-3.5" />
          Добавить
        </button>
      </div>

      <div className="divide-y divide-border">
        {users.map((u) => {
          const passAge = Date.now() - new Date(u.passwordChangedAt).getTime();
          const passDaysLeft = Math.max(0, 30 - Math.floor(passAge / (24 * 60 * 60 * 1000)));
          const passExpiring = passDaysLeft <= 7;

          return (
            <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${u.banned ? "bg-error/10 text-error" : "bg-primary/20 text-primary"}`}>
                  {u.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary">{u.fullName}</span>
                    <span className="text-xs text-text-muted">@{u.username}</span>
                    {u.banned && (
                      <span className="flex items-center gap-0.5 rounded bg-error/15 px-1.5 py-0.5 text-[10px] text-error font-medium">
                        <Ban className="h-2.5 w-2.5" /> Забанен
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${roleColors[u.role] || "bg-primary/20 text-primary"}`}>{u.role}</span>
                    {passExpiring && (
                      <span className="flex items-center gap-0.5 text-[10px] text-warning">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {passDaysLeft === 0 ? "Пароль истёк" : `Пароль: ${passDaysLeft} дн.`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                  className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                >
                  Действия <ChevronDown className="h-3 w-3" />
                </button>
                {openMenu === u.id && (
                  <div
                    className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-border bg-surface shadow-xl"
                    onMouseLeave={() => setOpenMenu(null)}
                  >
                    <button
                      onClick={() => { setChangePassFor(u); setOpenMenu(null); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Сменить пароль
                    </button>
                    {u.banned ? (
                      <button
                        onClick={() => { unban(u); setOpenMenu(null); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-success hover:bg-surface-hover transition-colors"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Разбанить
                      </button>
                    ) : (
                      u.role !== "owner" && (
                        <button
                          onClick={() => { setBanFor(u); setOpenMenu(null); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs text-warning hover:bg-surface-hover transition-colors"
                        >
                          <Ban className="h-3.5 w-3.5" /> Заблокировать
                        </button>
                      )
                    )}
                    {u.role !== "owner" && (
                      <button
                        onClick={() => { deleteUser(u); setOpenMenu(null); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-error hover:bg-surface-hover transition-colors border-t border-border"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Удалить
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
