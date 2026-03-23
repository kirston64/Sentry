"use client";

import { useRouter } from "next/navigation";
import { Monitor, Clock, Copy, Check } from "lucide-react";
import { useState } from "react";

interface DeviceCode {
  id: string;
  code: string;
  username: string;
  deviceLabel: string;
  expiresAt: string;
  createdAt: string;
}

export function DeviceCodesManager({ codes }: { codes: DeviceCode[] }) {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="divide-y divide-warning/20">
      {codes.map((c) => {
        const expiresIn = Math.max(0, Math.floor((new Date(c.expiresAt).getTime() - Date.now()) / 60000));
        return (
          <div key={c.id} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <Monitor className="h-4 w-4 text-warning" />
              <div>
                <p className="text-sm text-text-primary">
                  <span className="font-medium">{c.username}</span>
                  <span className="text-text-muted"> — {c.deviceLabel}</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Clock className="h-3 w-3" />
                  Истекает через {expiresIn} мин.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-widest text-warning">{c.code}</span>
              <button
                onClick={() => copyCode(c.id, c.code)}
                className="rounded p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
                title="Копировать код"
              >
                {copiedId === c.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
