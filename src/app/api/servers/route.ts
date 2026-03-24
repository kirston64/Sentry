import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { encryptPassword } from "@/lib/ssh-collect";
import crypto from "crypto";

function deriveStatus(status: string, lastSeenAt: Date | null): string {
  if (!lastSeenAt) return "offline";
  const staleSec = (Date.now() - new Date(lastSeenAt).getTime()) / 1000;
  if (staleSec > 120) return "offline";
  return status;
}

export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      include: {
        metrics: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { name: "asc" },
    });

    const result = servers.map((s) => ({
      id: s.id,
      name: s.name,
      ip: s.ip,
      port: s.port,
      maxPlayers: s.maxPlayers,
      status: deriveStatus(s.status, s.lastSeenAt),
      gameMode: s.gameMode,
      mapName: s.mapName,
      type: s.type,
      lastSeenAt: s.lastSeenAt,
      collectError: s.collectError,
      hasSSH: !!(s.sshUser && s.sshPassword),
      metrics: s.metrics[0]
        ? {
            ...s.metrics[0],
            connectedUsers: JSON.parse((s.metrics[0] as { connectedUsers?: string }).connectedUsers ?? "[]"),
          }
        : { playersOnline: 0, cpuPercent: 0, ramPercent: 0, diskPercent: 0, uptimeSeconds: 0, tickRate: 0, activeUsers: 0, connectedUsers: [] },
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "owner" && session.role !== "admin")) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const body = await request.json();
    const { name, ip, port, maxPlayers, gameMode, mapName, type, sshUser, sshPassword } = body;

    if (!name || !ip) {
      return NextResponse.json({ error: "Укажите название и IP" }, { status: 400 });
    }

    const apiKey = crypto.randomBytes(32).toString("hex");
    const serverType = type === "linux" ? "linux" : "game";

    const server = await prisma.server.create({
      data: {
        name: name.trim(),
        ip: ip.trim(),
        port: port ? Number(port) : (serverType === "linux" ? 22 : 30120),
        maxPlayers: maxPlayers ? Number(maxPlayers) : 128,
        gameMode: gameMode?.trim() || "Roleplay",
        mapName: mapName?.trim() || "Los Santos",
        type: serverType,
        apiKey,
        sshUser: sshUser?.trim() || null,
        sshPassword: sshPassword ? encryptPassword(sshPassword) : null,
        status: "offline",
      },
    });

    return NextResponse.json({ ...server, apiKey }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
