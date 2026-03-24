import { Ban, AlertTriangle } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function BannedPage() {
  const profile = await getSession();
  let banReason: string | null = null;

  if (profile) {
    const user = await prisma.user.findUnique({
      where: { id: profile.id },
      select: { banReason: true },
    }).catch(() => null);
    banReason = user?.banReason ?? null;
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-error/10 flex items-center justify-center border border-error/30 animate-pulse">
            <Ban className="h-12 w-12 text-error" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-error mb-2">Доступ заблокирован</h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            Ваш аккаунт был заблокирован администрацией.<br />
            Доступ к дашборду приостановлен.
          </p>
        </div>

        {/* Reason */}
        {banReason && (
          <div className="rounded-lg border border-error/30 bg-error/5 p-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-error shrink-0" />
              <span className="text-sm font-medium text-error">Причина блокировки</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">{banReason}</p>
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg border border-border bg-surface p-4 text-left text-xs text-text-muted leading-relaxed">
          Если вы считаете, что блокировка была ошибочной, свяжитесь с owner проекта через
          Telegram или Discord напрямую.
        </div>

        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
        >
          Вернуться на страницу входа
        </a>
      </div>
    </div>
  );
}
