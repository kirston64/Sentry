import { NextResponse } from "next/server";
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
