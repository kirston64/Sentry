"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, User, Lock, AlertCircle, ShieldCheck, KeyRound } from "lucide-react";

type LoginStep = "credentials" | "otp" | "change-password";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>("credentials");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [expiredUserId, setExpiredUserId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (step === "change-password") {
        if (newPassword.length < 6) {
          setError("Пароль должен быть не менее 6 символов");
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setError("Пароли не совпадают");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: expiredUserId, oldPassword: password, newPassword }),
        });

        if (res.ok) {
          setStep("credentials");
          setPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setInfo("Пароль изменён. Войдите с новым паролем.");
        } else {
          const data = await res.json();
          setError(data.error || "Ошибка смены пароля");
        }
        setLoading(false);
        return;
      }

      const body: Record<string, string> = {
        username: username.trim(),
        password,
      };

      if (step === "otp") {
        body.otpCode = otpCode.trim();
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      if (res.status === 202 && data.requireOTP) {
        setStep("otp");
        setDeviceLabel(data.deviceLabel);
        setInfo(data.message);
      } else if (res.status === 403 && data.passwordExpired) {
        setStep("change-password");
        setExpiredUserId(data.userId);
        setInfo("");
      } else {
        setError(data.error || "Ошибка входа");
      }
    } catch {
      setError("Ошибка соединения");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/10 px-3 py-2 text-xs text-error">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {info && !error && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          {info}
        </div>
      )}

      {step === "credentials" && (
        <>
          <div>
            <label className="mb-1.5 block text-xs text-text-muted">Логин</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-border-focus"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-text-muted">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-border-focus"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!username.trim() || !password || loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Вход..." : "Войти"}
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <div className="rounded-md border border-border bg-surface/50 p-3">
            <p className="text-xs text-text-muted">
              Обнаружен вход с нового устройства: <span className="text-accent">{deviceLabel}</span>
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Запросите код у администратора и введите его ниже.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-text-muted">Код подтверждения</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-3 text-center text-lg font-mono tracking-[0.5em] text-text-primary placeholder-text-muted outline-none transition-colors focus:border-border-focus"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={otpCode.length !== 6 || loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4" />
            {loading ? "Проверка..." : "Подтвердить"}
          </button>

          <button
            type="button"
            onClick={() => { setStep("credentials"); setOtpCode(""); setError(""); setInfo(""); }}
            className="w-full text-center text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Назад к входу
          </button>
        </>
      )}

      {step === "change-password" && (
        <>
          <div className="rounded-md border border-warning/30 bg-warning/10 p-3">
            <p className="text-xs text-warning font-medium">Срок действия пароля истёк</p>
            <p className="mt-1 text-xs text-text-muted">
              Установите новый пароль для продолжения работы.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-text-muted">Новый пароль</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-border-focus"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-text-muted">Подтвердите пароль</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-border-focus"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!newPassword || !confirmPassword || loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-warning py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" />
            {loading ? "Сохранение..." : "Сменить пароль"}
          </button>

          <button
            type="button"
            onClick={() => { setStep("credentials"); setError(""); setInfo(""); }}
            className="w-full text-center text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Назад к входу
          </button>
        </>
      )}

      <p className="text-center text-[10px] text-text-muted">
        Аккаунты создаются администратором
      </p>
    </form>
  );
}
