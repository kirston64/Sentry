import { Ban, AlertTriangle, Send, MessageCircle, Github, Clock } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function BannedPage() {
  const profile = await getSession();

  let banReason: string | null = null;
  let bannedAt: Date | null = null;
  let banner: {
    fullName: string;
    username: string;
    role: string;
    telegram: string | null;
    discord: string | null;
    github: string | null;
  } | null = null;

  if (profile) {
    const user = await prisma.user.findUnique({
      where: { id: profile.id },
      select: { banReason: true, bannedAt: true, bannedBy: true },
    }).catch(() => null);

    banReason = user?.banReason ?? null;
    bannedAt = user?.bannedAt ?? null;

    if (user?.bannedBy) {
      banner = await prisma.user.findUnique({
        where: { id: user.bannedBy },
        select: { fullName: true, username: true, role: true, telegram: true, discord: true, github: true },
      }).catch(() => null);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-5">

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
            {bannedAt && (
              <div className="flex items-center gap-1 mt-2 text-[10px] text-text-muted">
                <Clock className="h-3 w-3" />
                {new Date(bannedAt).toLocaleString("ru-RU", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </div>
            )}
          </div>
        )}

        {/* Who banned */}
        {banner && (
          <div className="rounded-lg border border-border bg-surface p-4 text-left">
            <p className="text-xs text-text-muted mb-3">Заблокировал</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-error/10 flex items-center justify-center text-sm font-bold text-error shrink-0">
                {banner.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{banner.fullName}</p>
                <p className="text-xs text-text-muted">@{banner.username} · {banner.role}</p>
              </div>
            </div>

            {/* Contacts */}
            <div className="flex flex-wrap gap-2">
              {banner.telegram && (
                <a
                  href={`https://t.me/${banner.telegram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded bg-[#229ED9]/10 border border-[#229ED9]/20 px-2.5 py-1.5 text-xs text-[#229ED9] hover:bg-[#229ED9]/20 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  {banner.telegram}
                </a>
              )}
              {banner.discord && (
                <div className="flex items-center gap-1.5 rounded bg-[#5865F2]/10 border border-[#5865F2]/20 px-2.5 py-1.5 text-xs text-[#5865F2]">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {banner.discord}
                </div>
              )}
              {banner.github && (
                <a
                  href={`https://github.com/${banner.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded bg-surface-hover border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Github className="h-3.5 w-3.5" />
                  {banner.github}
                </a>
              )}
              {!banner.telegram && !banner.discord && !banner.github && (
                <p className="text-xs text-text-muted">Контакты не указаны</p>
              )}
            </div>
          </div>
        )}

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
