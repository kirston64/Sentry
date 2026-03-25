"use client";

import { useState } from "react";
import { X, Server, Check, Gamepad2, Monitor, Eye, EyeOff, Loader2 } from "lucide-react";

interface AddServerModalProps {
  onClose: () => void;
  onCreated: () => void;
}

type ServerType = "game" | "linux";

export function AddServerModal({ onClose, onCreated }: AddServerModalProps) {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [serverType, setServerType] = useState<ServerType>("linux");
  const [form, setForm] = useState({
    name: "",
    ip: "",
    port: "22",
    sshUser: "root",
    sshPassword: "",
    maxPlayers: "128",
    gameMode: "Roleplay",
    mapName: "Los Santos",
  });

  const handleTypeChange = (t: ServerType) => {
    setServerType(t);
    setForm((f) => ({ ...f, port: t === "linux" ? "22" : "22" }));
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleTestAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTesting(true);
    setError("");

    try {
      // Create server
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          ip: form.ip,
          port: form.port,
          sshUser: form.sshUser,
          sshPassword: form.sshPassword,
          maxPlayers: form.maxPlayers,
          gameMode: form.gameMode,
          mapName: form.mapName,
          type: serverType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка создания");
        return;
      }

      setTesting(false);

      // Test SSH connection by triggering first collect
      const collectRes = await fetch(`/api/servers/${data.id}/collect`, { method: "POST" });
      if (!collectRes.ok) {
        const cd = await collectRes.json();
        setError(`Сервер добавлен, но SSH не работает: ${cd.error}`);
      }

      setSuccess(true);
      onCreated();

      setTimeout(onClose, 1500);
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-y-auto max-h-[90vh] rounded-xl border border-border bg-bg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-text-primary">Добавить сервер</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleTestAndCreate} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-error bg-error/10 border border-error/20 rounded px-3 py-2">{error}</p>
          )}

          {success && (
            <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/20 rounded px-3 py-2">
              <Check className="h-4 w-4" />
              Сервер подключён и собирает метрики
            </div>
          )}

          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange("linux")}
              className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs transition-colors ${
                serverType === "linux"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-text-muted hover:text-text-primary"
              }`}
            >
              <Monitor className="h-4 w-4 shrink-0" />
              <div className="text-left">
                <p className="font-medium">Linux VPS</p>
                <p className="text-[10px] opacity-70">CPU · RAM · Диск</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("game")}
              className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs transition-colors ${
                serverType === "game"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-text-muted hover:text-text-primary"
              }`}
            >
              <Gamepad2 className="h-4 w-4 shrink-0" />
              <div className="text-left">
                <p className="font-medium">Игровой</p>
                <p className="text-[10px] opacity-70">FiveM · игроки</p>
              </div>
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-xs text-text-muted">Название *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={set("name")}
              placeholder={serverType === "linux" ? "Production VPS" : "Main RP Server"}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus"
            />
          </div>

          {/* IP + port */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-text-muted">IP-адрес *</label>
              <input
                type="text"
                required
                value={form.ip}
                onChange={set("ip")}
                placeholder="77.110.126.59"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">SSH-порт</label>
              <input
                type="number"
                value={form.port}
                onChange={set("port")}
                placeholder="22"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus"
              />
            </div>
          </div>

          {/* SSH credentials */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-text-muted">Логин</label>
              <input
                type="text"
                value={form.sshUser}
                onChange={set("sshUser")}
                placeholder="root"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-muted">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.sshPassword}
                  onChange={set("sshPassword")}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 pr-8 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Game-specific fields */}
          {serverType === "game" && (
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
              <div>
                <label className="mb-1 block text-xs text-text-muted">Макс. игроков</label>
                <input
                  type="number"
                  value={form.maxPlayers}
                  onChange={set("maxPlayers")}
                  placeholder="128"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-muted">Режим игры</label>
                <input
                  type="text"
                  value={form.gameMode}
                  onChange={set("gameMode")}
                  placeholder="Roleplay"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-border-focus"
                />
              </div>
            </div>
          )}

          <div className="rounded-md bg-surface/60 border border-border px-3 py-2 text-[11px] text-text-muted">
            Пароль хранится в зашифрованном виде (AES-256). Дашборд сам подключается по SSH каждые 30 сек.
          </div>

          <button
            type="submit"
            disabled={loading || !form.name || !form.ip}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {testing ? "Подключение по SSH..." : loading ? "Сохранение..." : "Добавить и подключить"}
          </button>
        </form>
      </div>
    </div>
  );
}
