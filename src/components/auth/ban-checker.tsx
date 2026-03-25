"use client";

import { useEffect, useState } from "react";
import { Ban } from "lucide-react";

export function BanChecker() {
  const [banInfo, setBanInfo] = useState<{ reason: string } | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/me/ban-status");
        if (res.status === 403) {
          const data = await res.json();
          setBanInfo({ reason: data.reason || "Нарушение правил" });
        }
      } catch {
        // ignore network errors
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!banInfo) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-error/40 bg-surface p-8 text-center shadow-2xl space-y-5 mx-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-error/10 flex items-center justify-center border border-error/30 animate-pulse">
            <Ban className="h-10 w-10 text-error" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-error mb-1">Аккаунт заблокирован</h2>
          <p className="text-sm text-text-muted">
            Owner заблокировал ваш аккаунт. Доступ к дашборду прекращён.
          </p>
        </div>

        <div className="rounded-lg border border-error/20 bg-error/5 p-3 text-left">
          <p className="text-xs font-medium text-error mb-1">Причина</p>
          <p className="text-xs text-text-muted">{banInfo.reason}</p>
        </div>

        <a
          href="/"
          className="block w-full rounded-lg bg-error/10 border border-error/30 py-2.5 text-sm font-medium text-error hover:bg-error/20 transition-colors"
        >
          Выйти
        </a>
      </div>
    </div>
  );
}
