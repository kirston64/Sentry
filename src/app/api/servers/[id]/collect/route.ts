import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { collectViaSSH } from "@/lib/ssh-collect";
import { sendCriticalAlert } from "@/lib/telegram";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const server = await prisma.server.findUnique({ where: { id } });

    if (!server) return NextResponse.json({ error: "Сервер не найден" }, { status: 404 });
    if (!server.sshUser || !server.sshPassword) {
      return NextResponse.json({ error: "SSH не настроен" }, { status: 400 });
    }

    const { metrics, logs, connectedUsers } = await collectViaSSH(
      server.ip,
      server.port,
      server.sshUser,
      server.sshPassword,
      server.type
    );

    // Find latest log we already have to avoid duplicates
    const latestLog = await prisma.logEntry.findFirst({
      where: { serverId: id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const latestTs = latestLog ? latestLog.createdAt.getTime() : 0;
    const newLogs = logs.filter((l) => l.ts > latestTs && l.message.trim());

    await prisma.$transaction([
      prisma.serverMetrics.create({
        data: {
          serverId: id,
          cpuPercent: metrics.cpuPercent,
          ramPercent: metrics.ramPercent,
          diskPercent: metrics.diskPercent,
          uptimeSeconds: metrics.uptimeSeconds,
          activeUsers: metrics.activeUsers,
          playersOnline: metrics.playersOnline,
          connectedUsers: JSON.stringify(connectedUsers),
          tickRate: 64,
        },
      }),
      prisma.server.update({
        where: { id },
        data: { status: "online", lastSeenAt: new Date(), collectError: null },
      }),
      prisma.serverMetrics.deleteMany({
        where: { serverId: id, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.logEntry.deleteMany({
        where: { serverId: id, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      ...(newLogs.length > 0
        ? [prisma.logEntry.createMany({
            data: newLogs.map((l) => ({
              serverId: id,
              level: l.level,
              source: l.source,
              message: l.message,
              createdAt: new Date(l.ts),
            })),
          })]
        : []),
    ]);

    // Check alert thresholds
    const threshold = await prisma.alertThreshold.findUnique({ where: { serverId: id } });
    if (threshold) {
      const now = new Date();
      const cooldownMs = (threshold.cooldownMin ?? 15) * 60 * 1000;
      const canAlert = !threshold.lastAlertAt || (now.getTime() - threshold.lastAlertAt.getTime() > cooldownMs);

      if (canAlert) {
        const breaches: string[] = [];
        if (threshold.cpuPercent != null && metrics.cpuPercent >= threshold.cpuPercent)
          breaches.push(`CPU ${metrics.cpuPercent.toFixed(1)}% >= ${threshold.cpuPercent}%`);
        if (threshold.ramPercent != null && metrics.ramPercent >= threshold.ramPercent)
          breaches.push(`RAM ${metrics.ramPercent.toFixed(1)}% >= ${threshold.ramPercent}%`);
        if (threshold.diskPercent != null && metrics.diskPercent >= threshold.diskPercent)
          breaches.push(`Disk ${metrics.diskPercent.toFixed(1)}% >= ${threshold.diskPercent}%`);
        if (threshold.playersOnline != null && metrics.playersOnline >= threshold.playersOnline)
          breaches.push(`Игроки ${metrics.playersOnline} >= ${threshold.playersOnline}`);

        if (breaches.length > 0) {
          await prisma.alertThreshold.update({
            where: { serverId: id },
            data: { lastAlertAt: now },
          });

          const admin = await prisma.user.findFirst({ where: { role: { in: ["owner", "admin"] } } });
          if (admin) {
            await prisma.incident.create({
              data: {
                title: `[Авто] Превышены пороги на ${server.name}: ${breaches.join(", ")}`,
                severity: "P2",
                status: "investigating",
                creatorId: admin.id,
                timeline: {
                  create: {
                    message: `Автоматически обнаружено превышение порогов: ${breaches.join(", ")}`,
                    authorId: admin.id,
                  },
                },
              },
            });
          }

          sendCriticalAlert(
            `Превышены пороги: ${server.name}`,
            `⚠️ <b>${server.name}</b>\n\n${breaches.map(b => `• ${b}`).join("\n")}`
          ).catch(() => {});
        }
      }
    }

    return NextResponse.json({ ok: true, metrics });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const { id } = await params;

    const server = await prisma.server.findUnique({ where: { id }, select: { name: true, ip: true, status: true } }).catch(() => null);

    // Only alert if server was previously online (avoid spam on first connect)
    if (server?.status === "online") {
      sendCriticalAlert(
        `Сервер недоступен: ${server.name}`,
        `🖥 <b>${server.name}</b> (<code>${server.ip}</code>) не отвечает на SSH-подключение.\n\n❌ Ошибка: <code>${msg}</code>`
      ).catch(() => {});
    }

    await prisma.server.update({
      where: { id },
      data: { status: "offline", collectError: msg },
    }).catch(() => {});

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
