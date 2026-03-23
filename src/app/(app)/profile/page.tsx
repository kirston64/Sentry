"use client";

import { useState, useEffect, useCallback } from "react";
import { useProfile } from "@/components/auth/profile-context";
import {
  User, Lock, Shield, Monitor, Clock, Save, AlertTriangle,
  MessageSquare, Globe, KeyRound, Trash2, CheckCircle
} from "lucide-react";

interface ProfileData {
  id: string;
  username: string;
  fullName: string;
  role: string;
  bio: string | null;
  timezone: string | null;
  discord: string | null;
  telegram: string | null;
  github: string | null;
  passwordChangedAt: string;
  createdAt: string;
  sessions: { id: string; userAgent: string | null; ip: string | null; createdAt: string }[];
  trustedDevices: { id: string; label: string | null; lastUsedAt: string; createdAt: string }[];
}

export default function ProfilePage() {
  const profile = useProfile();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("");
  const [discord, setDiscord] = useState("");
  const [telegram, setTelegram] = useState("");
  const [github, setGithub] = useState("");

  // Password change
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const d = await res.json();
      setData(d);
      setFullName(d.fullName || "");
      setBio(d.bio || "");
      setTimezone(d.timezone || "");
      setDiscord(d.discord || "");
      setTelegram(d.telegram || "");
      setGithub(d.github || "");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, bio, timezone, discord, telegram, github }),
    });
    if (res.ok) {
      showMessage("success", "Профиль обновлён");
      fetchProfile();
    } else {
      showMessage("error", "Ошибка сохранения");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      showMessage("error", "Пароль должен быть не менее 6 символов");
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage("error", "Пароли не совпадают");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (res.ok) {
      showMessage("success", "Пароль изменён");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      fetchProfile();
    } else {
      const d = await res.json();
      showMessage("error", d.error || "Ошибка смены пароля");
    }
    setSaving(false);
  };

  const handleRemoveDevice = async (deviceId: string) => {
    const res = await fetch(`/api/profile/devices/${deviceId}`, { method: "DELETE" });
    if (res.ok) {
      showMessage("success", "Устройство удалено");
      fetchProfile();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        <div className="h-64 animate-pulse rounded-lg bg-surface" />
      </div>
    );
  }

  if (!data) return null;

  const passwordAge = Date.now() - new Date(data.passwordChangedAt).getTime();
  const passwordDaysLeft = Math.max(0, 30 - Math.floor(passwordAge / (24 * 60 * 60 * 1000)));
  const passwordExpiring = passwordDaysLeft <= 7;

  const roleColors: Record<string, string> = {
    owner: "bg-error/20 text-error",
    admin: "bg-warning/20 text-warning",
    developer: "bg-primary/20 text-primary",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
          {data.fullName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">{data.fullName}</h1>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>@{data.username}</span>
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${roleColors[data.role] || ""}`}>
              {data.role}
            </span>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
          message.type === "success"
            ? "border-success/30 bg-success/10 text-success"
            : "border-error/30 bg-error/10 text-error"
        }`}>
          {message.type === "success" ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {message.text}
        </div>
      )}

      {/* Password expiry warning */}
      {passwordExpiring && (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {passwordDaysLeft === 0
            ? "Срок действия пароля истёк! Смените пароль немедленно."
            : `Срок действия пароля истекает через ${passwordDaysLeft} дн. Смените пароль.`
          }
        </div>
      )}

      {/* Profile info form */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-text-primary">
          <User className="h-4 w-4 text-primary" />
          Информация профиля
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-text-muted">Полное имя</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-border bg-bg py-2 px-3 text-sm text-text-primary outline-none focus:border-border-focus" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">Часовой пояс</label>
            <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="UTC+3 Москва"
              className="w-full rounded-md border border-border bg-bg py-2 px-3 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-text-muted">О себе</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              className="w-full rounded-md border border-border bg-bg py-2 px-3 text-sm text-text-primary outline-none focus:border-border-focus resize-none" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs text-text-muted">
              <MessageSquare className="h-3 w-3" /> Discord
            </label>
            <input value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="User#0000"
              className="w-full rounded-md border border-border bg-bg py-2 px-3 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus" />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs text-text-muted">
              <Globe className="h-3 w-3" /> Telegram
            </label>
            <input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username"
              className="w-full rounded-md border border-border bg-bg py-2 px-3 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus" />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-xs text-text-muted">
              <Globe className="h-3 w-3" /> GitHub
            </label>
            <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="username"
              className="w-full rounded-md border border-border bg-bg py-2 px-3 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus" />
          </div>
        </div>

        <button onClick={handleSaveProfile} disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
          <Save className="h-4 w-4" />
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      {/* Password change */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-text-primary">
          <Lock className="h-4 w-4 text-warning" />
          Смена пароля
          <span className="text-xs text-text-muted font-normal">
            (последняя смена: {new Date(data.passwordChangedAt).toLocaleDateString("ru-RU")}, осталось {passwordDaysLeft} дн.)
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-text-muted">Текущий пароль</label>
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-bg py-2 px-3 text-sm text-text-primary outline-none focus:border-border-focus" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">Новый пароль</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-bg py-2 px-3 text-sm text-text-primary outline-none focus:border-border-focus" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-muted">Подтверждение</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-bg py-2 px-3 text-sm text-text-primary outline-none focus:border-border-focus" />
          </div>
        </div>

        <button onClick={handleChangePassword} disabled={saving || !oldPassword || !newPassword}
          className="mt-3 flex items-center gap-2 rounded-md bg-warning px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50">
          <KeyRound className="h-4 w-4" />
          Сменить пароль
        </button>
      </div>

      {/* Trusted devices */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-text-primary">
          <Monitor className="h-4 w-4 text-accent" />
          Доверенные устройства
        </div>

        {data.trustedDevices.length === 0 ? (
          <p className="text-xs text-text-muted">Нет доверенных устройств</p>
        ) : (
          <div className="divide-y divide-border">
            {data.trustedDevices.map((device) => (
              <div key={device.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-text-primary">{device.label || "Неизвестное устройство"}</p>
                  <p className="text-xs text-text-muted">
                    Последний вход: {new Date(device.lastUsedAt).toLocaleString("ru-RU")}
                  </p>
                </div>
                <button onClick={() => handleRemoveDevice(device.id)}
                  className="rounded p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active sessions */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-text-primary">
          <Shield className="h-4 w-4 text-success" />
          Активные сессии
        </div>

        <div className="divide-y divide-border">
          {data.sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs text-text-primary font-mono">{session.ip || "N/A"}</p>
                <p className="text-xs text-text-muted truncate max-w-md">
                  {session.userAgent?.substring(0, 80) || "Unknown"}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Clock className="h-3 w-3" />
                {new Date(session.createdAt).toLocaleString("ru-RU")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account info */}
      <div className="rounded-lg border border-border bg-surface/50 p-4 text-xs text-text-muted">
        Аккаунт создан: {new Date(data.createdAt).toLocaleDateString("ru-RU")}
        {" | "}Пароль обновляется каждые 30 дней
      </div>
    </div>
  );
}
