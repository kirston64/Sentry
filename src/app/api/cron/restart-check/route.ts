import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function cronMatches(cronExpr: string, date: Date): boolean {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length < 5) return false;
  const [min, hour] = parts;
  const minMatch = min === "*" || parseInt(min) === date.getMinutes();
  const hourMatch = hour === "*" || parseInt(hour) === date.getHours();
  return minMatch && hourMatch;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "cron-dev-secret";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const restarts = await prisma.scheduledRestart.findMany({
    where: { enabled: true },
    include: { server: true },
  });

  const executed = [];

  for (const restart of restarts) {
    if (!cronMatches(restart.cronExpr, now)) continue;

    // Don't re-run within same minute
    if (restart.lastRunAt) {
      const diff = now.getTime() - restart.lastRunAt.getTime();
      if (diff < 60000) continue;
    }

    await prisma.scheduledRestart.update({
      where: { id: restart.id },
      data: { lastRunAt: now },
    });

    await prisma.server.update({
      where: { id: restart.serverId },
      data: { status: "restarting" },
    });

    const owner = await prisma.user.findFirst({ where: { role: "owner" } });
    if (owner) {
      await prisma.auditLog.create({
        data: {
          userId: owner.id,
          action: "server.restart.auto",
          target: restart.server.name,
          details: `Scheduled restart: ${restart.label || restart.cronExpr}`,
        },
      });

      await prisma.logEntry.create({
        data: {
          serverId: restart.serverId,
          level: "info",
          source: "scheduler",
          message: `Scheduled restart initiated: ${restart.label || restart.cronExpr}`,
        },
      });
    }

    // Simulate restart completing after 30s
    setTimeout(async () => {
      try {
        await prisma.server.update({ where: { id: restart.serverId }, data: { status: "online" } });
      } catch { /* */ }
    }, 30000);

    executed.push({ server: restart.server.name, restart: restart.label || restart.cronExpr });
  }

  return NextResponse.json({ checked: restarts.length, executed });
}
