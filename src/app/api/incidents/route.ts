import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const incidents = await prisma.incident.findMany({
      include: {
        assignee: { select: { id: true, username: true, fullName: true } },
        creator: { select: { id: true, username: true, fullName: true } },
        timeline: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { username: true, fullName: true } } },
        },
        postmortem: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(incidents);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getSession();
    if (!profile) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { title, severity, assigneeId } = await request.json();
    if (!title || !severity) {
      return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 });
    }

    const incident = await prisma.incident.create({
      data: {
        title,
        severity,
        assigneeId: assigneeId || null,
        creatorId: profile.id,
        timeline: {
          create: { message: `Инцидент создан: ${title}`, authorId: profile.id },
        },
      },
      include: {
        assignee: { select: { id: true, username: true, fullName: true } },
        creator: { select: { id: true, username: true, fullName: true } },
        timeline: { include: { author: { select: { username: true, fullName: true } } } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: { userId: profile.id, action: "incident.create", target: title, details: severity },
    });

    return NextResponse.json(incident, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
