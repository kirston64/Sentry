import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasRole } from "@/lib/rbac";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const restarts = await prisma.scheduledRestart.findMany({
    include: { server: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(restarts);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { serverId, cronExpr, label } = body;

  if (!serverId || !cronExpr) return NextResponse.json({ error: "serverId и cronExpr обязательны" }, { status: 400 });

  const restart = await prisma.scheduledRestart.create({
    data: { serverId, cronExpr, label: label ?? null, createdBy: session.id },
    include: { server: { select: { id: true, name: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      action: "CREATE_SCHEDULED_RESTART",
      target: restart.server.name,
      details: `cron: ${cronExpr}`,
    },
  });

  return NextResponse.json(restart);
}
