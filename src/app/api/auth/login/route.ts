import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import {
  createToken,
  COOKIE_NAME,
  getRequestMeta,
  PASSWORD_MAX_AGE_DAYS,
} from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { sendOTPToUser, isTelegramConfigured, sendMessage } from "@/lib/telegram";

const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

async function recordFailed(username: string, ip: string, userAgent: string, reason: string) {
  await prisma.failedLogin.create({
    data: { username, ip, userAgent, reason },
  }).catch(() => {});

  // Telegram alert
  if (ADMIN_CHAT_ID) {
    const labels: Record<string, string> = {
      wrong_password: "Неверный пароль",
      wrong_otp: "Неверный OTP-код",
      rate_limit: "Превышен лимит попыток",
      user_not_found: "Пользователь не найден",
    };
    sendMessage(ADMIN_CHAT_ID,
      `⚠️ <b>Неудачная попытка входа</b>\n\n` +
      `👤 Логин: <code>${username}</code>\n` +
      `🌐 IP: <code>${ip}</code>\n` +
      `❌ Причина: ${labels[reason] || reason}`
    ).catch(() => {});
  }
}

export async function POST(request: Request) {
  try {
    const { userAgent, ip } = await getRequestMeta();

    const rateLimit = checkRateLimit(`login:${ip}`);
    if (!rateLimit.allowed) {
      const retryMinutes = Math.ceil(rateLimit.retryAfterMs / 60000);
      const body = await request.json().catch(() => ({ username: "unknown" }));
      await recordFailed(body.username || "unknown", ip, userAgent, "rate_limit");
      return NextResponse.json(
        { error: `Слишком много попыток. Повторите через ${retryMinutes} мин.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password, otpCode } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Введите логин и пароль" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      await recordFailed(username, ip, userAgent, "user_not_found");
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await recordFailed(username, ip, userAgent, "wrong_password");
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    // Check password expiry
    const passwordAge = Date.now() - new Date(user.passwordChangedAt).getTime();
    const passwordExpired = passwordAge > PASSWORD_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    if (passwordExpired) {
      return NextResponse.json({
        error: "Срок действия пароля истёк. Необходимо сменить пароль.",
        passwordExpired: true,
        userId: user.id,
      }, { status: 403 });
    }

    // === OTP STEP ===
    if (isTelegramConfigured()) {
      if (!otpCode) {
        await prisma.loginOTP.updateMany({
          where: { userId: user.id, used: false },
          data: { used: true },
        });

        const code = generateOTP();
        await prisma.loginOTP.create({
          data: {
            userId: user.id,
            code,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        });

        await sendOTPToUser(user.username, code, user.telegramChatId);

        return NextResponse.json(
          {
            requireOTP: true,
            hasTelegram: !!user.telegramChatId,
            message: user.telegramChatId
              ? "Код отправлен в Telegram"
              : "Код отправлен администратору",
          },
          { status: 202 }
        );
      }

      // Verify OTP
      const otp = await prisma.loginOTP.findFirst({
        where: {
          userId: user.id,
          code: otpCode.trim(),
          used: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!otp) {
        await recordFailed(username, ip, userAgent, "wrong_otp");
        return NextResponse.json(
          { error: "Неверный или просроченный код" },
          { status: 401 }
        );
      }

      await prisma.loginOTP.update({
        where: { id: otp.id },
        data: { used: true },
      });
    }

    resetRateLimit(`login:${ip}`);

    const token = createToken(user.id);
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        userAgent,
        ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.SECURE_COOKIES === "true",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
