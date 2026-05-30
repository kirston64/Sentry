import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { collectViaSSH } from "@/lib/ssh-collect";
import { sendCriticalAlert } from "@/lib/telegram";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "cron-dev-secret";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cleanup expired sessions
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});

  const [servers, thresholds] = await Promise.all([
    prisma.server.findMany(),
    prisma.alertThreshold.findMany(),
  ]);

  const thresholdMap = new Map(thresholds.map((t) => [t.serverId, t]));
  const owner = await prisma.user.findFirst({ where: { role: "owner" } });
  const results = [];

  for (const server of servers) {
    const threshold = thresholdMap.get(server.id) ?? null;
    const wasOnlineBefore = server.status === "online";

    // SSH collect for Linux servers
    if (server.type === "linux" && server.sshUser && server.sshPassword) {
      try {
        const { metrics: sshMetrics, connectedUsers, logs } = await collectViaSSH(
          server.ip, server.port, server.sshUser, server.sshPassword, server.type
        );
        await prisma.$transaction([
          prisma.serverMetrics.create({
            data: {
              serverId: server.id,
              cpuPercent: sshMetrics.cpuPercent,
              ramPercent: sshMetrics.ramPercent,
              diskPercent: sshMetrics.diskPercent,
              uptimeSeconds: sshMetrics.uptimeSeconds,
              activeUsers: sshMetrics.activeUsers,
              playersOnline: sshMetrics.playersOnline,
              connectedUsers: JSON.stringify(connectedUsers),
              tickRate: 64,
            },
          }),
          prisma.server.update({
            where: { id: server.id },
            data: { status: "online", lastSeenAt: new Date(), collectError: null },
          }),
        ]);

        // Save SSH logs and check alert rules against them
        if (logs.length > 0) {
          const alertRules = await prisma.logAlertRule.findMany({ where: { enabled: true } });
          for (const log of logs.slice(0, 50)) {
            const entry = await prisma.logEntry.create({
              data: { serverId: server.id, level: log.level, source: log.source, message: log.message },
            });
            for (const rule of alertRules) {
              if (rule.serverId && rule.serverId !== server.id) continue;
              if (rule.level && rule.level !== log.level) continue;
              try {
                if (new RegExp(rule.pattern, "i").test(log.message)) {
                  sendCriticalAlert(
                    `🔔 Log Alert: ${rule.name}`,
                    `Сервер: ${server.name}\nУровень: ${log.level}\nИсточник: ${log.source}\nСообщение: ${log.message}`
                  ).catch(() => {});
                }
              } catch { /* bad regex */ }
            }
            void entry;
          }
        }

        await checkThresholds(server, sshMetrics, threshold, owner);
        results.push({ server: server.name, metrics: sshMetrics });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "SSH error";
        await prisma.server.update({
          where: { id: server.id },
          data: { status: "offline", collectError: msg },
        }).catch(() => {});

        if (wasOnlineBefore) {
          await autoIncident(
            server.id, server.name, "P1",
            `Сервер недоступен: ${server.name}`,
            `Потеря SSH-соединения: ${msg}`,
            owner
          );
        }
        results.push({ server: server.name, error: msg });
      }
      continue;
    }

    // FiveM HTTP collect + simulation
    let metrics;
    let isReachable = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const playersRes = await fetch(`http://${server.ip}:${server.port}/players.json`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (playersRes.ok) {
        const players = await playersRes.json();
        isReachable = true;
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
      const lastMetric = await prisma.serverMetrics.findFirst({
        where: { serverId: server.id },
        orderBy: { createdAt: "desc" },
      });

      if (!wasOnlineBefore) {
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
        status: isReachable ? "up" : "down",
        responseMs: isReachable ? Math.round(Math.random() * 50 + 10) : null,
      },
    });

    // Server went offline this tick
    if (wasOnlineBefore && !isReachable) {
      await prisma.server.update({ where: { id: server.id }, data: { status: "offline" } });
      await autoIncident(
        server.id, server.name, "P1",
        `Сервер недоступен: ${server.name}`,
        `Сервер не отвечает на запросы (порт ${server.port})`,
        owner
      );
    }

    await checkThresholds(server, metrics, threshold, owner);
    results.push({ server: server.name, metrics: saved });
  }

  // Simulated log entries for online game servers
  const templates = [
    { level: "info", source: "fivem-core", msgs: ["Auto-save completed", "Player connected", "Resource started"] },
    { level: "info", source: "ox_inventory", msgs: ["Inventory synced", "Item transfer completed"] },
    { level: "warn", source: "mysql-async", msgs: ["Slow query detected", "Connection pool nearing limit"] },
    { level: "error", source: "sentry_anticheat", msgs: ["Suspicious speed detected", "Teleport attempt blocked"] },
    { level: "debug", source: "pma-voice", msgs: ["Voice channel updated", "Proximity check completed"] },
  ];

  const onlineGameServers = servers.filter((s) => s.status === "online" && s.type === "game");
  if (onlineGameServers.length > 0) {
    const count = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < count; i++) {
      const tmpl = templates[Math.floor(Math.random() * templates.length)];
      const srv = onlineGameServers[Math.floor(Math.random() * onlineGameServers.length)];
      await prisma.logEntry.create({
        data: { serverId: srv.id, level: tmpl.level, source: tmpl.source, message: tmpl.msgs[Math.floor(Math.random() * tmpl.msgs.length)] },
      });
    }
  }

  return NextResponse.json({ collected: results.length, servers: results });
}

interface MetricSnapshot {
  cpuPercent: number;
  ramPercent: number;
  diskPercent?: number;
  playersOnline: number;
  uptimeSeconds?: number;
  tickRate?: number;
}

interface AlertThresholdRow {
  id: string;
  serverId: string;
  cpuPercent: number | null;
  ramPercent: number | null;
  diskPercent: number | null;
  playersOnline: number | null;
  cooldownMin: number;
  lastAlertAt: Date | null;
}

interface UserRow { id: string }

async function checkThresholds(
  server: { id: string; name: string },
  metrics: MetricSnapshot,
  threshold: AlertThresholdRow | null,
  owner: UserRow | null
) {
  const cpu = threshold?.cpuPercent ?? 90;
  const ram = threshold?.ramPercent ?? null;
  const disk = threshold?.diskPercent ?? null;
  const players = threshold?.playersOnline ?? null;
  const cooldownMs = (threshold?.cooldownMin ?? 15) * 60 * 1000;
  const lastAlert = threshold?.lastAlertAt ? new Date(threshold.lastAlertAt).getTime() : 0;
  const now = Date.now();

  if (now - lastAlert < cooldownMs) return;

  const breaches: string[] = [];
  if (metrics.cpuPercent > cpu) breaches.push(`CPU ${metrics.cpuPercent}% > ${cpu}%`);
  if (ram !== null && metrics.ramPercent > ram) breaches.push(`RAM ${metrics.ramPercent}% > ${ram}%`);
  if (disk !== null && metrics.diskPercent !== undefined && metrics.diskPercent > disk) breaches.push(`Disk ${metrics.diskPercent}% > ${disk}%`);
  if (players !== null && metrics.playersOnline > players) breaches.push(`Players ${metrics.playersOnline} > ${players}`);

  if (breaches.length === 0) return;

  const detail = breaches.join(", ");

  await autoIncident(
    server.id, server.name, "P2",
    `Превышение порогов на ${server.name}`,
    detail,
    owner
  );

  sendCriticalAlert(
    `⚠️ Порог превышен: ${server.name}`,
    `Сервер: <b>${server.name}</b>\n${detail}`
  ).catch(() => {});

  if (threshold) {
    await prisma.alertThreshold.update({
      where: { id: threshold.id },
      data: { lastAlertAt: new Date() },
    }).catch(() => {});
  }
}

async function autoIncident(
  serverId: string,
  serverName: string,
  severity: string,
  title: string,
  detail: string,
  owner: UserRow | null
) {
  if (!owner) return;
  const existing = await prisma.incident.findFirst({
    where: {
      title: { contains: serverName },
      status: { not: "resolved" },
      createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
    },
  });
  if (existing) return;

  await prisma.incident.create({
    data: {
      title,
      severity,
      status: "investigating",
      creatorId: owner.id,
      timeline: {
        create: { message: `Авто-обнаружение: ${detail}`, authorId: owner.id },
      },
    },
  });

  sendCriticalAlert(
    severity === "P1" ? `🔴 P1 Инцидент: ${serverName}` : `🟠 P2 Инцидент: ${serverName}`,
    `<b>${title}</b>\n\n${detail}`
  ).catch(() => {});

  void serverId;
}
