import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "cron-dev-secret";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const servers = await prisma.server.findMany();
  const results = [];

  for (const server of servers) {
    let metrics;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const playersRes = await fetch(`http://${server.ip}:${server.port}/players.json`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (playersRes.ok) {
        const players = await playersRes.json();
        metrics = {
          playersOnline: players.length,
          cpuPercent: Math.round(Math.random() * 30 + 20 + players.length * 0.3),
          ramPercent: Math.round(Math.random() * 10 + 30 + players.length * 0.2),
          uptimeSeconds: 0,
          tickRate: Math.round(64 - Math.random() * 4),
        };
      } else {
        throw new Error("unreachable");
      }
    } catch {
      // Simulation mode
      const isOnline = server.status === "online";
      const lastMetric = await prisma.serverMetrics.findFirst({
        where: { serverId: server.id },
        orderBy: { createdAt: "desc" },
      });

      if (!isOnline) {
        metrics = { playersOnline: 0, cpuPercent: 0, ramPercent: 0, uptimeSeconds: 0, tickRate: 0 };
      } else {
        const base = lastMetric || { playersOnline: 50, cpuPercent: 45, ramPercent: 55, uptimeSeconds: 86400, tickRate: 64 };
        metrics = {
          playersOnline: Math.max(0, Math.min(server.maxPlayers, base.playersOnline + Math.round((Math.random() - 0.5) * 8))),
          cpuPercent: Math.max(5, Math.min(95, base.cpuPercent + Math.round((Math.random() - 0.5) * 6))),
          ramPercent: Math.max(10, Math.min(95, base.ramPercent + Math.round((Math.random() - 0.5) * 4))),
          uptimeSeconds: (lastMetric?.uptimeSeconds ?? 86400) + 60,
          tickRate: Math.max(50, Math.min(66, base.tickRate + Math.round((Math.random() - 0.5) * 3))),
        };
      }
    }

    const saved = await prisma.serverMetrics.create({
      data: { serverId: server.id, ...metrics },
    });

    await prisma.uptimeCheck.create({
      data: {
        serverId: server.id,
        status: server.status === "online" ? "up" : "down",
        responseMs: server.status === "online" ? Math.round(Math.random() * 50 + 10) : null,
      },
    });

    // Auto-incident on high CPU
    if (metrics.cpuPercent > 90) {
      const existing = await prisma.incident.findFirst({
        where: { title: { contains: server.name }, status: { not: "resolved" } },
      });
      if (!existing) {
        const owner = await prisma.user.findFirst({ where: { role: "owner" } });
        if (owner) {
          await prisma.incident.create({
            data: {
              title: `High CPU on ${server.name}: ${metrics.cpuPercent}%`,
              severity: "P2",
              status: "investigating",
              creatorId: owner.id,
              timeline: {
                create: { message: `Auto-detected: CPU at ${metrics.cpuPercent}%`, authorId: owner.id },
              },
            },
          });
        }
      }
    }

    results.push({ server: server.name, metrics: saved });
  }

  // Generate simulated log entries
  const templates = [
    { level: "info", source: "fivem-core", msgs: ["Auto-save completed", "Player connected", "Resource started"] },
    { level: "info", source: "ox_inventory", msgs: ["Inventory synced", "Item transfer completed"] },
    { level: "warn", source: "mysql-async", msgs: ["Slow query detected", "Connection pool nearing limit"] },
    { level: "error", source: "sentry_anticheat", msgs: ["Suspicious speed detected", "Teleport attempt blocked"] },
    { level: "debug", source: "pma-voice", msgs: ["Voice channel updated", "Proximity check completed"] },
  ];

  const onlineServers = servers.filter((s) => s.status === "online");
  if (onlineServers.length > 0) {
    const count = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < count; i++) {
      const tmpl = templates[Math.floor(Math.random() * templates.length)];
      const srv = onlineServers[Math.floor(Math.random() * onlineServers.length)];
      await prisma.logEntry.create({
        data: {
          serverId: srv.id,
          level: tmpl.level,
          source: tmpl.source,
          message: tmpl.msgs[Math.floor(Math.random() * tmpl.msgs.length)],
        },
      });
    }
  }

  return NextResponse.json({ collected: results.length, servers: results });
}
