"use client";

import { useState, useEffect } from "react";
import { Bell, Save, Loader2 } from "lucide-react";

interface Server { id: string; name: string; }
interface Threshold {
  serverId: string;
  cpuPercent: number | null;
  ramPercent: number | null;
  diskPercent: number | null;
  playersOnline: number | null;
  cooldownMin: number;
  server: { id: string; name: string };
}

export function AlertThresholds() {
  const [servers, setServers] = useState<Server[]>([]);
  const [thresholds, setThresholds] = useState<Record<string, Threshold>>({});
  const [selected, setSelected] = useState("");
  const [form, setForm] = useState({ cpuPercent: "", ramPercent: "", diskPercent: "", playersOnline: "", cooldownMin: "15" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/servers").then(r => r.json()).catch(() => []),
      fetch("/api/alerts").then(r => r.json()).catch(() => []),
    ]).then(([s, a]) => {
      if (Array.isArray(s)) setServers(s);
      if (Array.isArray(a)) {
        const map: Record<string, Threshold> = {};
        for (const t of a) map[t.serverId] = t;
        setThresholds(map);
      }
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    const t = thresholds[selected];
    if (t) {
      setForm({
        cpuPercent: t.cpuPercent != null ? String(t.cpuPercent) : "",
        ramPercent: t.ramPercent != null ? String(t.ramPercent) : "",
        diskPercent: t.diskPercent != null ? String(t.diskPercent) : "",
        playersOnline: t.playersOnline != null ? String(t.playersOnline) : "",
        cooldownMin: String(t.cooldownMin ?? 15),
      });
    } else {
      setForm({ cpuPercent: "", ramPercent: "", diskPercent: "", playersOnline: "", cooldownMin: "15" });
    }
  }, [selected, thresholds]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const body = {
      serverId: selected,
      cpuPercent: form.cpuPercent ? parseFloat(form.cpuPercent) : null,
      ramPercent: form.ramPercent ? parseFloat(form.ramPercent) : null,
      diskPercent: form.diskPercent ? parseFloat(form.diskPercent) : null,
      playersOnline: form.playersOnline ? parseInt(form.playersOnline) : null,
      cooldownMin: parseInt(form.cooldownMin) || 15,
    };
    const res = await fetch("/api/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      setThresholds(prev => ({ ...prev, [selected]: data }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-warning" />
        <span className="text-sm font-medium text-text-primary">Пороги алертов</span>
      </div>

      <div>
        <label className="text-[11px] text-text-muted mb-1 block">Сервер</label>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="h-8 pl-3 pr-7 rounded border border-border bg-bg text-sm text-text-primary appearance-none focus:outline-none focus:border-primary"
        >
          <option value="">Выбрать сервер...</option>
          {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {selected && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: "cpuPercent", label: "CPU %", placeholder: "напр. 90" },
              { key: "ramPercent", label: "RAM %", placeholder: "напр. 85" },
              { key: "diskPercent", label: "Disk %", placeholder: "напр. 95" },
              { key: "playersOnline", label: "Игроков", placeholder: "напр. 100" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-[11px] text-text-muted mb-1 block">{label}</label>
                <input
                  type="number"
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full h-8 px-3 rounded border border-border bg-bg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-[11px] text-text-muted mb-1 block">Cooldown (мин)</label>
              <input
                type="number"
                value={form.cooldownMin}
                onChange={e => setForm(p => ({ ...p, cooldownMin: e.target.value }))}
                className="w-24 h-8 px-3 rounded border border-border bg-bg text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 mt-4 rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/80 disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              {saved ? "Сохранено!" : "Сохранить"}
            </button>
          </div>
          <p className="text-[11px] text-text-muted">
            Оставьте поле пустым чтобы отключить порог. При превышении создаётся инцидент P2 и отправляется Telegram-алерт.
          </p>
        </div>
      )}
    </div>
  );
}
