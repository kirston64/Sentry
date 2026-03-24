"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";

export function TelegramSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const configured = typeof window !== "undefined"
    ? undefined // will check via API
    : undefined;

  const registerWebhook = async () => {
    setLoading(true);
    setResult(null);
    try {
      const url = window.location.origin;
      const res = await fetch("/api/telegram/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult("✅ Webhook зарегистрирован успешно!");
      } else {
        setResult(`❌ Ошибка: ${data.description || JSON.stringify(data)}`);
      }
    } catch {
      setResult("❌ Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const steps = [
    {
      num: "1",
      title: "Создай бота",
      content: (
        <div className="space-y-1.5">
          <p className="text-xs text-text-muted">Напиши боту <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-primary hover:underline">@BotFather</a> в Telegram:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-bg px-2 py-1.5 text-xs font-mono text-text-primary">/newbot</code>
            <button onClick={() => copy("/newbot", "newbot")} className="text-text-muted hover:text-text-primary">
              {copied === "newbot" ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="text-xs text-text-muted">Получишь токен вида <code className="text-primary">1234567890:AAF...</code></p>
        </div>
      ),
    },
    {
      num: "2",
      title: "Добавь в .env.production на сервере",
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-bg px-2 py-1.5 text-[11px] font-mono text-text-muted">
              TELEGRAM_BOT_TOKEN=1234567890:AAF...
            </code>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-bg px-2 py-1.5 text-[11px] font-mono text-text-muted">
              TELEGRAM_ADMIN_CHAT_ID=твой_chat_id
            </code>
            <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-text-muted hover:text-primary shrink-0">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-[11px] text-text-muted">
            Свой chat_id узнай у бота <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-primary hover:underline">@userinfobot</a>
          </p>
          <div className="rounded bg-bg px-3 py-2 text-[11px] font-mono text-text-muted space-y-1">
            <p className="text-text-muted font-sans">Команды в SSH:</p>
            <p>echo 'TELEGRAM_BOT_TOKEN=...' &gt;&gt; /opt/sentry-dashboard/.env.production</p>
            <p>echo 'TELEGRAM_ADMIN_CHAT_ID=...' &gt;&gt; /opt/sentry-dashboard/.env.production</p>
            <p>cd /opt/sentry-dashboard && docker compose up -d --force-recreate app</p>
          </div>
        </div>
      ),
    },
    {
      num: "3",
      title: "Зарегистрируй webhook",
      content: (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">После добавления токена и рестарта нажми кнопку:</p>
          <button
            onClick={registerWebhook}
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Зарегистрировать webhook
          </button>
          {result && <p className="text-xs">{result}</p>}
        </div>
      ),
    },
    {
      num: "4",
      title: "Команды бота",
      content: (
        <div className="space-y-1.5 text-xs text-text-muted">
          <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1">
            <code className="text-primary">/start</code>
            <span>— инструкция</span>
            <code className="text-primary">/otp username</code>
            <span>— сгенерировать код входа (admin/owner)</span>
            <code className="text-primary">/link username пароль</code>
            <span>— привязать Telegram к аккаунту</span>
            <code className="text-primary">/me</code>
            <span>— показать привязанный аккаунт</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-5 space-y-4">
      <p className="text-xs text-text-muted">
        После настройки — при каждом входе будет запрашиваться одноразовый код из Telegram (действует 5 минут).
      </p>

      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.num} className="flex gap-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {step.num}
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-xs font-medium text-text-primary">{step.title}</p>
              {step.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
