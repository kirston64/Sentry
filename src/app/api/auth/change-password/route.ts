import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { oldPassword, newPassword, userId } = body;

    // Admins/owners can change other users' passwords by passing userId
    const targetId = (session.role === "owner" || session.role === "admin") && userId
      ? userId
      : session.id;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Пароль должен быть не менее 8 символов" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: targetId } });
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

    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: targetId },
      data: { password: hash, passwordChangedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: "auth.change_password",
        target: user.username,
        details: targetId !== session.id ? "admin override" : undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
