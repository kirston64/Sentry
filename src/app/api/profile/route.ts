import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const profile = await getSession();
    if (!profile) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: profile.id },
      include: {
        sessions: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, userAgent: true, ip: true, createdAt: true } },
        trustedDevices: { orderBy: { lastUsedAt: "desc" }, select: { id: true, label: true, lastUsedAt: true, createdAt: true } },
      },
    });

    if (!user) return NextResponse.json({ error: "Не найден" }, { status: 404 });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      bio: user.bio,
      timezone: user.timezone,
      discord: user.discord,
      telegram: user.telegram,
      github: user.github,
      avatar: user.avatar,
      passwordChangedAt: user.passwordChangedAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
      specialties: user.specialties,
      sessions: user.sessions,
      trustedDevices: user.trustedDevices,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await getSession();
    if (!profile) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const body = await request.json();
    const allowed = ["fullName", "bio", "timezone", "discord", "telegram", "github"];

    // Handle specialties separately (array → JSON)
    if (Array.isArray(body.specialties)) {
      await prisma.user.update({
        where: { id: profile.id },
        data: { specialties: JSON.stringify(body.specialties.slice(0, 5)) },
      });
      if (Object.keys(body).length === 1) return NextResponse.json({ ok: true });
    }
    const updateData: Record<string, string> = {};

    for (const key of allowed) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    // Handle password change
    if (body.oldPassword && body.newPassword) {
      const user = await prisma.user.findUnique({ where: { id: profile.id } });
      if (!user) return NextResponse.json({ error: "Не найден" }, { status: 404 });

      const valid = await bcrypt.compare(body.oldPassword, user.password);
      if (!valid) return NextResponse.json({ error: "Неверный текущий пароль" }, { status: 401 });

      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: "Пароль должен быть не менее 6 символов" }, { status: 400 });
      }

      const hash = await bcrypt.hash(body.newPassword, 10);
      await prisma.user.update({
        where: { id: profile.id },
        data: { password: hash, passwordChangedAt: new Date(), ...updateData },
      });

      return NextResponse.json({ ok: true, passwordChanged: true });
    }

    await prisma.user.update({
      where: { id: profile.id },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
