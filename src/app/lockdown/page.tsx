import { ShieldOff, AlertTriangle } from "lucide-react";

export default function LockdownPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-error/10 flex items-center justify-center border border-error/30 animate-pulse">
              <ShieldOff className="h-12 w-12 text-error" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-error mb-2">Аварийный режим</h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            Система временно заблокирована администраторами.<br />
            Доступ к дашборду приостановлен.
          </p>
        </div>

        {/* Warning box */}
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-left">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <span className="text-sm font-medium text-warning">Что происходит?</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Owner активировал аварийный режим. Это может означать инцидент безопасности,
            технические работы или экстренную ситуацию. Обратитесь к руководителю для получения информации.
          </p>
        </div>

        {/* Contact */}
        <p className="text-xs text-text-muted">
          Если у вас есть доступ owner — войдите снова для управления блокировкой.
        </p>

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
