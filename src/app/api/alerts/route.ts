import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasRole } from "@/lib/rbac";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thresholds = await prisma.alertThreshold.findMany({
    include: { server: { select: { id: true, name: true } } },
  });
  return NextResponse.json(thresholds);
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { serverId, cpuPercent, ramPercent, diskPercent, playersOnline, cooldownMin } = body;

  if (!serverId) return NextResponse.json({ error: "serverId required" }, { status: 400 });

  const threshold = await prisma.alertThreshold.upsert({
    where: { serverId },
    create: {
      serverId,
      cpuPercent: cpuPercent ?? null,
      ramPercent: ramPercent ?? null,
      diskPercent: diskPercent ?? null,
      playersOnline: playersOnline ?? null,
      cooldownMin: cooldownMin ?? 15,
    },
    update: {
      cpuPercent: cpuPercent ?? null,
      ramPercent: ramPercent ?? null,
      diskPercent: diskPercent ?? null,
      playersOnline: playersOnline ?? null,
      cooldownMin: cooldownMin ?? 15,
    },
    include: { server: { select: { id: true, name: true } } },
  });

  return NextResponse.json(threshold);
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");
  if (!serverId) return NextResponse.json({ error: "serverId required" }, { status: 400 });

  await prisma.alertThreshold.deleteMany({ where: { serverId } });
  return NextResponse.json({ ok: true });
}
