import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendOTPToUser } from "@/lib/telegram";
import crypto from "crypto";

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "owner" && session.role !== "admin")) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

    // Invalidate old OTPs
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

    return NextResponse.json({
      ok: true,
      code,
      sentToTelegram: !!user.telegramChatId,
      username: user.username,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
