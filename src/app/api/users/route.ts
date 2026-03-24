import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        bio: true,
        timezone: true,
        discord: true,
        telegram: true,
        github: true,
        avatar: true,
        lastActiveAt: true,
        banned: true,
        banReason: true,
        bannedAt: true,
        specialties: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: true,
            deploys: true,
            assignedIncidents: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner" && session.role !== "admin") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  try {
    const { username, fullName, password, role } = await req.json();

    if (!username?.trim() || !fullName?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Логин, имя и пароль обязательны" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Пароль минимум 6 символов" }, { status: 400 });
    }
    // Only owner can create admins/owners
    const assignedRole = (session.role === "owner" && ["owner", "admin", "developer"].includes(role))
      ? role
      : "developer";

    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) return NextResponse.json({ error: "Логин уже занят" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
        password: hashed,
        role: assignedRole,
      },
      select: { id: true, username: true, fullName: true, role: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "owner") {
    return NextResponse.json({ error: "Только owner может удалять пользователей" }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    if (id === session.id) {
      return NextResponse.json({ error: "Нельзя удалить себя" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
