"use client";

import { useState, useMemo, useEffect } from "react";
import { Users, Filter, UserPlus, X, Eye, EyeOff, Ban, ShieldCheck } from "lucide-react";
import { MemberCard } from "@/components/team/member-card";
import { enrichUsers, type ApiUser } from "@/lib/team-display-data";
import type { UserRole } from "@/types/database";
import type { TeamMember } from "@/types/team";

// ─── Add User Modal ────────────────────────────────────────────────────────────

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
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-text-primary">Добавить пользователя</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Логин</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="например: ivan"
              autoComplete="off"
              required
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Полное имя</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Иван Петров"
              required
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Пароль</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Минимум 6 символов"
                required
                className="w-full rounded border border-border bg-bg px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
              <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Роль</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="developer">Developer</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border border-border py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Создание..." : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Ban Modal ─────────────────────────────────────────────────────────────────

function BanModal({
  member,
  onClose,
  onBanned,
}: {
  member: TeamMember & { banned?: boolean };
  onClose: () => void;
  onBanned: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${member.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      onBanned();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-error/40 bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-error" />
            <h2 className="text-base font-bold text-error">Заблокировать пользователя</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User info */}
        <div className="mb-4 rounded-lg border border-border bg-bg p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-error/10 flex items-center justify-center text-xs font-bold text-error">
            {member.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{member.username}</p>
            <p className="text-xs text-text-muted">{member.fullName} · {member.role}</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Причина блокировки</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Укажите причину блокировки..."
              rows={3}
              required
              className="w-full rounded border border-border bg-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-error resize-none"
            />
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-text-muted">
            Пользователь немедленно потеряет доступ к дашборду. Все активные сессии будут завершены.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border border-border py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded bg-error py-2 text-sm font-medium text-white hover:bg-error/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Блокировка..." : "Заблокировать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [onlineFilter, setOnlineFilter] = useState<"all" | "online" | "offline">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<(TeamMember & { banned?: boolean }) | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const loadUsers = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((users: ApiUser[]) => setMembers(enrichUsers(users)))
      .catch(() => {});
  };

  useEffect(() => {
    loadUsers();
    // Get current user info for permission checks
    fetch("/api/me").then((r) => r.json()).then((d) => {
      if (d.id) { setCurrentUserId(d.id); setCurrentUserRole(d.role); }
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (onlineFilter === "online" && !m.isOnline) return false;
      if (onlineFilter === "offline" && m.isOnline) return false;
      return true;
    });
  }, [members, roleFilter, onlineFilter]);

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Удалить пользователя "${name}"? Это действие нельзя отменить.`)) return;
    setDeleting(id);
    try {
      await fetch("/api/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      loadUsers();
    } finally {
      setDeleting(null);
    }
  };

  const unbanUser = async (id: string) => {
    await fetch(`/api/users/${id}/ban`, { method: "DELETE" });
    loadUsers();
  };

  const online = members.filter((m) => m.isOnline).length;

  return (
    <div className="space-y-6">
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onCreated={loadUsers} />}
      {banTarget && (
        <BanModal
          member={banTarget}
          onClose={() => setBanTarget(null)}
          onBanned={loadUsers}
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Team</h1>
          <span className="ml-2 text-xs text-text-muted">{online} / {members.length} онлайн</span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Добавить
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <Filter className="h-3 w-3" />
          Фильтры:
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
          className="rounded border border-border bg-surface px-2 py-1 text-xs text-text-primary outline-none focus:border-primary"
        >
          <option value="all">Все роли</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="developer">Developer</option>
        </select>
        <div className="flex gap-1">
          {(["all", "online", "offline"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setOnlineFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                onlineFilter === f ? "bg-surface-hover text-text-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {f === "all" ? "Все" : f === "online" ? "Онлайн" : "Офлайн"}
            </button>
          ))}
        </div>
        {(roleFilter !== "all" || onlineFilter !== "all") && (
          <button
            onClick={() => { setRoleFilter("all"); setOnlineFilter("all"); }}
            className="text-[10px] text-primary hover:underline"
          >
            Сбросить
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((member) => {
          const isOwner = currentUserRole === "owner";
          const isSelf = member.id === currentUserId;
          const isMemberOwner = member.role === "owner";
          const apiMember = member as TeamMember & { banned?: boolean };
          return (
            <MemberCard
              key={member.id}
              member={member}
              onDelete={isOwner ? () => deleteUser(member.id, member.fullName) : undefined}
              onBan={isOwner && !isSelf && !isMemberOwner && !apiMember.banned
                ? () => setBanTarget(apiMember)
                : undefined}
              onUnban={isOwner && apiMember.banned
                ? () => unbanUser(member.id)
                : undefined}
              banned={apiMember.banned}
            />
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-text-muted">Нет участников с выбранными фильтрами</p>
        )}
      </div>
    </div>
  );
}
