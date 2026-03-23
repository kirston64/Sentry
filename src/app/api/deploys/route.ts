import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const deploys = await prisma.deploy.findMany({
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        server: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: "desc" },
    });

    const result = deploys.map((d) => ({
      ...d,
      logs: JSON.parse(d.logs),
      triggeredByName: d.user.fullName || d.user.username,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
