import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  createToken,
  COOKIE_NAME,
  generateDeviceFingerprint,
  generateOTP,
  getRequestMeta,
  getDeviceLabel,
  PASSWORD_MAX_AGE_DAYS,
} from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const { userAgent, ip } = await getRequestMeta();

    const rateLimit = checkRateLimit(`login:${ip}`);
    if (!rateLimit.allowed) {
      const retryMinutes = Math.ceil(rateLimit.retryAfterMs / 60000);
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
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
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

    // Device verification — temporarily disabled
    // TODO: re-enable OTP device verification
    // const fingerprint = generateDeviceFingerprint(userAgent, ip);
    // const deviceLabel = getDeviceLabel(userAgent);

    // Reset rate limit on success
    resetRateLimit(`login:${ip}`);

    // Create session
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
      secure: process.env.NODE_ENV === "production",
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
