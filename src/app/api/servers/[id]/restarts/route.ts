import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const restarts = await prisma.scheduledRestart.findMany({
    where: { serverId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(restarts);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !hasRole(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { cronExpr, label, enabled } = await request.json();

  if (!cronExpr) return NextResponse.json({ error: "cronExpr required" }, { status: 400 });

  const restart = await prisma.scheduledRestart.create({
    data: { serverId: id, cronExpr, label: label || null, enabled: enabled ?? true, createdBy: session.id },
  });

  await prisma.auditLog.create({
    data: { userId: session.id, action: "server.restart.scheduled", target: id, details: `Scheduled: ${label || cronExpr}` },
  });

  return NextResponse.json(restart);
}
