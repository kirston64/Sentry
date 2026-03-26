import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasRole } from "@/lib/rbac";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const backups = await prisma.backup.findMany({
    include: {
      server: { select: { id: true, name: true } },
      creator: { select: { id: true, username: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(backups);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { serverId, name, notes } = body;

  if (!name) return NextResponse.json({ error: "name обязателен" }, { status: 400 });

  const backup = await prisma.backup.create({
    data: {
      serverId: serverId ?? null,
      name,
      notes: notes ?? null,
      status: "pending",
      createdBy: session.id,
    },
    include: {
      server: { select: { id: true, name: true } },
      creator: { select: { id: true, username: true, fullName: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      action: "CREATE_BACKUP",
      target: name,
      details: serverId ? `server: ${backup.server?.name}` : "manual",
    },
  });

  // Simulate async backup process
  setTimeout(async () => {
    const size = Math.floor(Math.random() * 500_000_000) + 50_000_000;
    await prisma.backup.update({
      where: { id: backup.id },
      data: { status: "success", size, finishedAt: new Date() },
    }).catch(() => {});
  }, 3000);

  return NextResponse.json(backup);
}
