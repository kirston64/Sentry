import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { userId, oldPassword, newPassword } = await request.json();

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Пароль должен быть не менее 6 символов" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Неверный текущий пароль" }, { status: 401 });
    }

    if (oldPassword === newPassword) {
      return NextResponse.json({ error: "Новый пароль должен отличаться от текущего" }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hash, passwordChangedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
